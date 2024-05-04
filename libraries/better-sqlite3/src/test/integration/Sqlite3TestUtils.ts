import { unlink } from 'node:fs/promises';
import { NoOpLogger, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { createTestAuthorizationAdapter, IntegrationTestSchema } from '@dossierhq/integration-test';
import { createServer, type Server } from '@dossierhq/server';
import Database from 'better-sqlite3';
import {
  createBetterSqlite3Adapter,
  type BetterSqlite3DatabaseAdapter,
} from '../../BetterSqlite3Adapter.js';

export interface ServerInit {
  server: Server;
}

// eslint-disable-next-line @typescript-eslint/ban-types
type LooseAutocomplete<T> = T | (string & {});

export async function initializeSqlite3Server(
  filename: LooseAutocomplete<':memory:'>,
  options?: Database.Options,
): PromiseResult<ServerInit, typeof ErrorType.Generic | typeof ErrorType.BadRequest> {
  const databaseAdapterResult = await createSqlite3TestAdapter(filename, options);
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

export async function initializeEmptySqlite3Server(
  filename: LooseAutocomplete<':memory:'>,
  options?: Database.Options,
): PromiseResult<Server, typeof ErrorType.Generic | typeof ErrorType.BadRequest> {
  if (filename !== ':memory:') {
    await unlink(filename);
  }

  const databaseAdapterResult = await createSqlite3TestAdapter(filename, options);
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
  options?: Database.Options,
): PromiseResult<
  BetterSqlite3DatabaseAdapter,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const context = { logger: NoOpLogger };
  const database = new Database(filename, options);
  return await createBetterSqlite3Adapter(context, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
}
