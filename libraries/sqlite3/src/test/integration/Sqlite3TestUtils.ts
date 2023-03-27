import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { AdminSchema, NoOpLogger, ok } from '@dossierhq/core';
import { createTestAuthorizationAdapter, IntegrationTestSchema } from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { createServer } from '@dossierhq/server';
import * as Sqlite from 'sqlite3';
import type { Sqlite3DatabaseAdapter } from '../../Sqlite3Adapter.js';
import { createSqlite3Adapter } from '../../Sqlite3Adapter.js';
import { createDatabase } from '../../SqliteUtils.js';

// TODO @types/sqlite is slightly wrong in terms of CommonJS/ESM export
const { Database } = (Sqlite as unknown as { default: typeof Sqlite }).default;

export interface ServerInit {
  server: Server;
  adminSchema: AdminSchema;
}

export async function initializeSqlite3Server(
  filename: string | ':memory:',
  mode?: number
): PromiseResult<ServerInit, typeof ErrorType.Generic | typeof ErrorType.BadRequest> {
  const databaseAdapterResult = await createSqlite3TestAdapter(filename, mode);
  if (databaseAdapterResult.isError()) return databaseAdapterResult;

  const createServerResult = await createServer({
    databaseAdapter: databaseAdapterResult.value,
    authorizationAdapter: createTestAuthorizationAdapter(),
  });
  if (createServerResult.isError()) return createServerResult;
  const server = createServerResult.value;

  const sessionResult = server.createSession({
    provider: 'test',
    identifier: 'schema-loader',
    defaultAuthKeys: [],
    logger: null,
    databasePerformance: null,
  });
  const client = server.createAdminClient(() => sessionResult);

  const schemaResult = await client.updateSchemaSpecification(IntegrationTestSchema);
  if (schemaResult.isError()) return schemaResult;
  const adminSchema = new AdminSchema(schemaResult.value.schemaSpecification);

  return ok({ server, adminSchema });
}

async function createSqlite3TestAdapter(
  filename: string | ':memory:',
  mode?: number
): PromiseResult<Sqlite3DatabaseAdapter, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const context = { logger: NoOpLogger };
  const databaseResult = await createDatabase(context, Database, {
    filename,
    mode,
  });
  if (databaseResult.isError()) return databaseResult;
  return await createSqlite3Adapter(context, databaseResult.value, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
}
