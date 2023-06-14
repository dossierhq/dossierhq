import type {
  AdminClient,
  AdminClientMiddleware,
  AdminEntity,
  AdminSchemaSpecificationUpdate,
  ClientContext,
} from '@dossierhq/core';
import { LoggingClientMiddleware, NoOpLogger, createConsoleLogger } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { NoneAndSubjectAuthorizationAdapter, createServer } from '@dossierhq/server';
import {
  createDatabase,
  createSqlite3Adapter,
  type SqliteDatabaseOptimizationOptions,
} from '@dossierhq/sqlite3';
import { unlink } from 'fs/promises';
import Sqlite from 'sqlite3';

export async function createNewDatabase(databasePath: string) {
  try {
    // delete existing database
    await unlink(databasePath);
  } catch (error) {
    // ignore
  }

  const context = { logger: NoOpLogger };
  const databaseResult = await createDatabase(context, Sqlite.Database, {
    filename: databasePath,
  });
  return databaseResult.valueOrThrow();
}

export async function createAdapterAndServer<
  TAdminClient extends AdminClient<AdminEntity<string, object>>
>(
  database: Sqlite.Database,
  schema: AdminSchemaSpecificationUpdate
): Promise<{
  adminClient: TAdminClient;
  bobAdminClient: TAdminClient;
  server: Server<SqliteDatabaseOptimizationOptions>;
}> {
  const databaseAdapter = (
    await createSqlite3Adapter({ logger: NoOpLogger }, database, {
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
      authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
    })
  ).valueOrThrow();

  const aliceSession = (
    await server.createSession({
      provider: 'sys',
      identifier: 'alice',
      defaultAuthKeys: ['none', 'subject'],
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
    defaultAuthKeys: ['none', 'subject'],
    logger: createConsoleLogger(console),
    databasePerformance: null,
  });
  const bobAdminClient = server.createAdminClient<TAdminClient>(
    () => bobSession,
    [LoggingClientMiddleware as AdminClientMiddleware<ClientContext>]
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
