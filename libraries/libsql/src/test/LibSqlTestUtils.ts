import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { NoOpLogger, ok } from '@dossierhq/core';
import { IntegrationTestSchema, createTestAuthorizationAdapter } from '@dossierhq/integration-test';
import { createServer, type Server } from '@dossierhq/server';
import type { SqliteDatabaseOptions } from '@dossierhq/sqlite-core';
import { createClient, type Config } from '@libsql/client';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import type { LibSqlDatabaseAdapter } from '../LibSqlAdapter.js';
import { createLibSqlAdapter } from '../LibSqlAdapter.js';

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
  assert(config.url.startsWith('file:'));
  const filename = config.url.slice(5);
  if (existsSync(filename)) {
    await unlink(filename);
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
