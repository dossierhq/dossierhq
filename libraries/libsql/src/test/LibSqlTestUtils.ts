import { NoOpLogger, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { createTestAuthorizationAdapter, IntegrationTestSchema } from '@dossierhq/integration-test';
import { createServer, type Server } from '@dossierhq/server';
import type { SqliteDatabaseOptions } from '@dossierhq/sqlite-core';
import { createClient, type Config } from '@libsql/client';
import { createLibSqlAdapter, type LibSqlDatabaseAdapter } from '../LibSqlAdapter.js';

export interface ServerInit {
  server: Server;
}

export async function initializeServer(
  config: Config,
  options: Pick<SqliteDatabaseOptions, 'journalMode'> = { journalMode: 'wal' },
): PromiseResult<ServerInit, typeof ErrorType.Generic | typeof ErrorType.BadRequest> {
  const databaseAdapterResult = await createAdapter(config, options);
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
  });
  const client = server.createDossierClient(() => sessionResult);

  const schemaResult = await client.updateSchemaSpecification(IntegrationTestSchema);
  if (schemaResult.isError()) return schemaResult;

  return ok({ server });
}

export async function initializeEmptyServer(
  config: Config,
  options: Pick<SqliteDatabaseOptions, 'journalMode'> = { journalMode: 'wal' },
): PromiseResult<Server, typeof ErrorType.Generic | typeof ErrorType.BadRequest> {
  const client = createClient(config);
  const tableCheck = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='events'",
  );
  if (tableCheck.rows.length > 0) {
    await client.batch([
      'DELETE FROM events',
      'DELETE FROM entities',
      'DELETE FROM schema_versions',
      'DELETE FROM subjects',
    ]);
  }

  const databaseAdapterResult = await createAdapter(config, options);
  if (databaseAdapterResult.isError()) return databaseAdapterResult;

  const createServerResult = await createServer({
    databaseAdapter: databaseAdapterResult.value,
    authorizationAdapter: createTestAuthorizationAdapter(),
  });
  if (createServerResult.isError()) return createServerResult;
  const server = createServerResult.value;

  return ok(server);
}

async function createAdapter(
  config: Config,
  options: Pick<SqliteDatabaseOptions, 'journalMode'>,
): PromiseResult<LibSqlDatabaseAdapter, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const context = { logger: NoOpLogger };
  const client = createClient(config);
  return await createLibSqlAdapter(context, client, {
    migrate: true,
    fts: { version: 'fts5' },
    ...options,
  });
}
