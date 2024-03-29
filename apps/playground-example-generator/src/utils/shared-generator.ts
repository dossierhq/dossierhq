import {
  createBetterSqlite3Adapter,
  type SqliteDatabaseOptimizationOptions,
} from '@dossierhq/better-sqlite3';
import type {
  AdminClient,
  AdminClientMiddleware,
  AdminEntity,
  AdminSchemaSpecificationUpdate,
  ClientContext,
  Component,
} from '@dossierhq/core';
import { createConsoleLogger, LoggingClientMiddleware, NoOpLogger } from '@dossierhq/core';
import { createServer, SubjectAuthorizationAdapter, type Server } from '@dossierhq/server';
import BetterSqlite3, { type Database } from 'better-sqlite3';
import { unlink } from 'fs/promises';

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
  TAdminClient extends AdminClient<AdminEntity<string, object>, Component<string, object>>,
>(
  database: Database,
  schema: AdminSchemaSpecificationUpdate,
): Promise<{
  adminClient: TAdminClient;
  bobAdminClient: TAdminClient;
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
      defaultAuthKeys: null,
      logger: createConsoleLogger(console),
      databasePerformance: null,
    })
  ).valueOrThrow();

  const adminClient = server.createAdminClient<TAdminClient>(aliceSession.context, [
    LoggingClientMiddleware as AdminClientMiddleware<ClientContext>,
  ]);
  (await adminClient.updateSchemaSpecification(schema)).valueOrThrow();

  const bobSession = server.createSession({
    provider: 'sys',
    identifier: 'bob',
    defaultAuthKeys: null,
    logger: createConsoleLogger(console),
    databasePerformance: null,
  });
  const bobAdminClient = server.createAdminClient<TAdminClient>(
    () => bobSession,
    [LoggingClientMiddleware as AdminClientMiddleware<ClientContext>],
  );

  return { adminClient, bobAdminClient, server };
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
