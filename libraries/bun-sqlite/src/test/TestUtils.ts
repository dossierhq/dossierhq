import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { AdminSchema, NoOpLogger, ok } from '@dossierhq/core';
import type { TestSuite } from '@dossierhq/integration-test';
import { createTestAuthorizationAdapter, IntegrationTestSchema } from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { createServer } from '@dossierhq/server';
import { Database } from 'bun:sqlite';
import { describe, it } from 'bun:test';
import { createBunSqliteAdapter } from '../BunSqliteAdapter.js';

export interface ServerInit {
  server: Server;
  adminSchema: AdminSchema;
}

export function registerTestSuite(suiteName: string, testSuite: TestSuite): void {
  describe(suiteName, () => {
    for (const [testName, testFunction] of Object.entries(testSuite)) {
      it(testName, testFunction);
    }
  });
}

export async function initializeIntegrationTestServer(
  filename: string
): PromiseResult<ServerInit, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const database = Database.open(filename);
  const serverResult = await createServer({
    databaseAdapter: (
      await createBunSqliteAdapter({ logger: NoOpLogger }, database, {
        migrate: true,
        fts: { version: 'fts4' },
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
