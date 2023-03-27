import type { Logger } from '@dossierhq/core';
import { AdminSchema } from '@dossierhq/core';
import type { AuthorizationAdapter, Server } from '@dossierhq/server';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@dossierhq/server';
import { createDatabase, createSqlite3Adapter } from '@dossierhq/sqlite3';
import * as Sqlite from 'sqlite3';
import { schemaSpecification } from './schema.js';

// TODO @types/sqlite is slightly wrong in terms of CommonJS/ESM export
const { Database: SqliteDatabase } = (Sqlite as unknown as { default: typeof Sqlite }).default;

const SQLITE3_DATABASE = 'data/foo.sqlite';

export async function initializeServer(logger: Logger) {
  const databaseResult = await createDatabase({ logger }, SqliteDatabase, {
    filename: SQLITE3_DATABASE,
  });
  if (databaseResult.isError()) return databaseResult;

  const adapterResult = await createSqlite3Adapter({ logger }, databaseResult.value, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
  if (adapterResult.isError()) return adapterResult;

  const serverResult = await createServer({
    databaseAdapter: adapterResult.value,
    authorizationAdapter: createAuthorizationAdapter(),
    logger,
  });
  return serverResult;
}

export async function updateSchema(server: Server) {
  const sessionResult = server.createSession({
    provider: 'sys',
    identifier: 'schemaloader',
    defaultAuthKeys: [],
    logger: null,
    databasePerformance: null,
  });

  const adminClient = server.createAdminClient(() => sessionResult);

  const schemaResult = await adminClient.updateSchemaSpecification(schemaSpecification);
  return new AdminSchema(schemaResult.valueOrThrow().schemaSpecification);
}

function createAuthorizationAdapter(): AuthorizationAdapter {
  return NoneAndSubjectAuthorizationAdapter;
}
