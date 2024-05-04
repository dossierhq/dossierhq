import { unlink } from 'fs/promises';
import {
  createBetterSqlite3Adapter,
  type SqliteDatabaseOptimizationOptions,
} from '@dossierhq/better-sqlite3';
import {
  createConsoleLogger,
  LoggingClientMiddleware,
  NoOpLogger,
  type ClientContext,
  type Component,
  type DossierClient,
  type DossierClientMiddleware,
  type Entity,
  type SchemaSpecificationUpdate,
} from '@dossierhq/core';
import { createServer, SubjectAuthorizationAdapter, type Server } from '@dossierhq/server';
import BetterSqlite3, { type Database } from 'better-sqlite3';

export async function createNewDatabase(databasePath: string): Promise<Database> {
  try {
    // delete existing database
    await unlink(databasePath);
  } catch (error) {
    // ignore
  }

  return new BetterSqlite3(databasePath);
}

export async function createAdapterAndServer<
  TDossierClient extends DossierClient<Entity<string, object>, Component<string, object>>,
>(
  database: Database,
  schema: SchemaSpecificationUpdate,
): Promise<{
  client: TDossierClient;
  bobDossierClient: TDossierClient;
  server: Server<SqliteDatabaseOptimizationOptions>;
}> {
  const databaseAdapter = (
    await createBetterSqlite3Adapter({ logger: NoOpLogger }, database, {
      migrate: true,
      fts: {
        version: 'fts4', // fts5 is not supported by sql.js used in the browser
      },
      journalMode: 'delete',
    })
  ).valueOrThrow();
  const server = (
    await createServer({
      databaseAdapter,
      authorizationAdapter: SubjectAuthorizationAdapter,
    })
  ).valueOrThrow();

  const aliceSession = (
    await server.createSession({
      provider: 'sys',
      identifier: 'alice',
      logger: createConsoleLogger(console),
    })
  ).valueOrThrow();

  const client = server.createDossierClient<TDossierClient>(aliceSession.context, [
    LoggingClientMiddleware as DossierClientMiddleware<ClientContext>,
  ]);
  (await client.updateSchemaSpecification(schema)).valueOrThrow();

  const bobSession = server.createSession({
    provider: 'sys',
    identifier: 'bob',
    logger: createConsoleLogger(console),
  });
  const bobDossierClient = server.createDossierClient<TDossierClient>(
    () => bobSession,
    [LoggingClientMiddleware as DossierClientMiddleware<ClientContext>],
  );

  return { client, bobDossierClient, server };
}

export async function optimizeAndCloseDatabase(server: Server) {
  let keepOnGoing = true;
  while (keepOnGoing) {
    const processed = (await server.processNextDirtyEntity()).valueOrThrow();
    if (!processed) {
      keepOnGoing = false;
    }
  }

  (await server.optimizeDatabase({ all: true })).throwIfError();

  await server.shutdown();
}
