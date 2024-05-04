import { unlink } from 'fs/promises';
import { NoOpLogger, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  createTestAuthorizationAdapter,
  IntegrationTestSchema,
  type TestSuite,
} from '@dossierhq/integration-test';
import { createServer, type Server } from '@dossierhq/server';
import { Database } from 'bun:sqlite';
import { describe, it } from 'bun:test';
import { createBunSqliteAdapter } from '../BunSqliteAdapter.js';

export interface ServerInit {
  server: Server;
}

export function registerTestSuite(suiteName: string, testSuite: TestSuite): void {
  describe(suiteName, () => {
    for (const [testName, testFunction] of Object.entries(testSuite)) {
      it(testName, testFunction);
    }
  });
}

export async function initializeIntegrationTestServer(
  filename: string,
): PromiseResult<ServerInit, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const database = Database.open(filename);
  const serverResult = await createServer({
    databaseAdapter: (
      await createBunSqliteAdapter({ logger: NoOpLogger }, database, {
        migrate: true,
        fts: { version: 'fts5' },
        journalMode: 'wal',
      })
    ).valueOrThrow(),
    authorizationAdapter: createTestAuthorizationAdapter(),
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const sessionResult = server.createSession({
    provider: 'test',
    identifier: 'schema-loader',
  });
  const client = server.createDossierClient(() => sessionResult);

  const schemaResult = await client.updateSchemaSpecification(IntegrationTestSchema);
  if (schemaResult.isError()) return schemaResult;

  return ok({ server });
}

export async function initializeEmptyIntegrationTestServer(
  filename: string,
): PromiseResult<Server, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  if (filename !== ':memory:') {
    await unlink(filename);
  }

  const database = Database.open(filename);
  return await createServer({
    databaseAdapter: (
      await createBunSqliteAdapter({ logger: NoOpLogger }, database, {
        migrate: true,
        fts: { version: 'fts5' },
        journalMode: 'wal',
      })
    ).valueOrThrow(),
    authorizationAdapter: createTestAuthorizationAdapter(),
  });
}
