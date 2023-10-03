import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { AdminSchema, NoOpLogger, ok } from '@dossierhq/core';
import { IntegrationTestSchema, createTestAuthorizationAdapter } from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { createServer } from '@dossierhq/server';
import { createClient } from '@libsql/client';
import { unlink } from 'node:fs/promises';
import type { LibSqlDatabaseAdapter } from '../../LibSqlAdapter.js';
import { createLibSqlAdapter } from '../../LibSqlAdapter.js';

export interface ServerInit {
  server: Server;
  adminSchema: AdminSchema;
}

// eslint-disable-next-line @typescript-eslint/ban-types
type LooseAutocomplete<T> = T | (string & {});

export async function initializeSqlite3Server(
  filename: LooseAutocomplete<':memory:'>,
): PromiseResult<ServerInit, typeof ErrorType.Generic | typeof ErrorType.BadRequest> {
  const databaseAdapterResult = await createSqlite3TestAdapter(filename);
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

export async function initializeEmptyServer(
  filename: LooseAutocomplete<':memory:'>,
): PromiseResult<Server, typeof ErrorType.Generic | typeof ErrorType.BadRequest> {
  if (filename !== ':memory:') {
    await unlink(filename);
  }

  const databaseAdapterResult = await createSqlite3TestAdapter(filename);
  if (databaseAdapterResult.isError()) return databaseAdapterResult;

  const createServerResult = await createServer({
    databaseAdapter: databaseAdapterResult.value,
    authorizationAdapter: createTestAuthorizationAdapter(),
  });
  if (createServerResult.isError()) return createServerResult;
  const server = createServerResult.value;

  return ok(server);
}

async function createSqlite3TestAdapter(
  filename: LooseAutocomplete<':memory:'>,
): PromiseResult<LibSqlDatabaseAdapter, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const context = { logger: NoOpLogger };
  const client = createClient({ url: `file:${filename}` });
  return await createLibSqlAdapter(context, client, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
}
