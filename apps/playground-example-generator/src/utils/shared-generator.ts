import type {
  AdminClientMiddleware,
  AdminSchemaSpecificationUpdate,
  ClientContext,
} from '@jonasb/datadata-core';
import { createConsoleLogger, LoggingClientMiddleware, NoOpLogger } from '@jonasb/datadata-core';
import {
  createDatabase,
  createSqlite3Adapter,
} from '@jonasb/datadata-database-adapter-sqlite-sqlite3';
import type { Server } from '@jonasb/datadata-server';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@jonasb/datadata-server';
import { unlink } from 'fs/promises';
import type { Database } from 'sqlite3';
import * as Sqlite from 'sqlite3';

// TODO @types/sqlite is slightly wrong in terms of CommonJS/ESM export
const { Database: SqliteDatabase } = (Sqlite as unknown as { default: typeof Sqlite }).default;

export async function createNewDatabase(databasePath: string) {
  try {
    // delete existing database
    await unlink(databasePath);
  } catch (error) {
    // ignore
  }

  const context = { logger: NoOpLogger };
  const databaseResult = await createDatabase(context, SqliteDatabase, {
    filename: databasePath,
  });
  return databaseResult.valueOrThrow();
}

export async function createAdapterAndServer<TAdminClient>(
  database: Database,
  schema: AdminSchemaSpecificationUpdate
): Promise<{ adminClient: TAdminClient; server: Server }> {
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

  const session = (
    await server.createSession({
      provider: 'sys',
      identifier: 'alice',
      defaultAuthKeys: ['none', 'subject'],
      logger: createConsoleLogger(console),
    })
  ).valueOrThrow();

  const adminClient = server.createAdminClient(session.context, [
    LoggingClientMiddleware as AdminClientMiddleware<ClientContext>,
  ]);
  (await adminClient.updateSchemaSpecification(schema)).valueOrThrow();

  return { adminClient: adminClient as TAdminClient, server };
}
