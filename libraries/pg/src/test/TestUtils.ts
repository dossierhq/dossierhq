import type {
  AdminClient,
  Entity,
  SchemaSpecificationUpdate,
  Connection,
  Edge,
  ErrorType,
  PromiseResult,
  PublishedEntity,
  Result,
} from '@dossierhq/core';
import { Schema, ok, withAdvisoryLock } from '@dossierhq/core';
import { createMockLogger, expectOkResult, expectResultValue } from '@dossierhq/core-vitest';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import {
  IntegrationTestSchema,
  createTestAuthorizationAdapter,
  type TestSuite,
} from '@dossierhq/integration-test';
import type { Server, SessionContext } from '@dossierhq/server';
import { createServer } from '@dossierhq/server';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { assert, describe, expect, test } from 'vitest';
import { createPostgresAdapter } from '../PgDatabaseAdapter.js';

export function registerTestSuite(testSuiteName: string, testSuite: TestSuite): void {
  describe(testSuiteName, () => {
    for (const [testName, testFunction] of Object.entries(testSuite)) {
      const timeout = testFunction.timeout ? { long: 50_000 }[testFunction.timeout] : undefined;
      test(testName, testFunction, { timeout });
    }
  });
}

function getConnectionString(selector?: 'default' | 'a' | 'b') {
  let value;
  if (selector === 'a') {
    value = process.env.DATABASE_A_URL;
  } else if (selector === 'b') {
    value = process.env.DATABASE_B_URL;
  } else {
    value = process.env.DATABASE_URL;
  }
  assert(value);
  return value;
}

export function createPostgresTestAdapter(connectionString: string): DatabaseAdapter {
  return createPostgresAdapter({ connectionString });
}

export async function createPostgresTestServerAndClient(): PromiseResult<
  { server: Server; context: SessionContext },
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const serverResult = await createServer({
    databaseAdapter: createPostgresTestAdapter(getConnectionString()),
    authorizationAdapter: createTestAuthorizationAdapter(),
    logger: createMockLogger(),
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;
  const sessionResult = await server.createSession({
    provider: 'test',
    identifier: 'identifier',
  });
  if (sessionResult.isError()) {
    await server.shutdown(); // ignore result
    return sessionResult;
  }
  const { context } = sessionResult.value;
  return ok({ server, context });
}

export interface IntegrationTestServerInit {
  server: Server;
}

export async function initializeIntegrationTestServer({
  selector,
}: { selector?: 'default' | 'a' | 'b' } = {}): PromiseResult<
  IntegrationTestServerInit,
  typeof ErrorType.Generic | typeof ErrorType.BadRequest
> {
  const connectionString = getConnectionString(selector);

  const serverResult = await createServer({
    databaseAdapter: createPostgresTestAdapter(connectionString),
    authorizationAdapter: createTestAuthorizationAdapter(),
    logger: createMockLogger(),
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const client = server.createAdminClient(() =>
    server.createSession({
      provider: 'test',
      identifier: 'schema-loader',
    }),
  );

  //TODO move this to integration-test and add advisory lock for update
  const schemaResult = await safelyUpdateSchemaSpecification(client, IntegrationTestSchema);
  if (schemaResult.isError()) return schemaResult;

  return ok({ server });
}

export async function initializeEmptyIntegrationTestServer({
  selector,
}: { selector?: 'default' | 'a' | 'b' } = {}): PromiseResult<
  Server,
  typeof ErrorType.Generic | typeof ErrorType.BadRequest
> {
  const connectionString = getConnectionString(selector);

  await clearDatabase(connectionString);

  const serverResult = await createServer({
    databaseAdapter: createPostgresTestAdapter(connectionString),
    authorizationAdapter: createTestAuthorizationAdapter(),
    logger: createMockLogger(),
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  return ok(server);
}

async function clearDatabase(connectionString: string) {
  const pool = new Pool({ connectionString });
  try {
    await pool.query('DELETE FROM events');
    await pool.query('DELETE FROM entities');
    await pool.query('DELETE FROM schema_versions');
    await pool.query('DELETE FROM principals');
    await pool.query('DELETE FROM subjects');
  } finally {
    await pool.end();
  }
}

export function expectSearchResultEntities<TItem extends Entity | PublishedEntity>(
  result: Result<
    Connection<Edge<TItem, ErrorType>> | null,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >,
  actualEntities: TItem[],
): void {
  if (expectOkResult(result)) {
    if (actualEntities.length === 0) {
      expect(result.value).toBeNull();
    } else {
      assert(result.value);
      expect(result.value.edges).toHaveLength(actualEntities.length);
      for (const [index, actualEntity] of actualEntities.entries()) {
        expectResultValue(result.value.edges[index].node, actualEntity);
      }
    }
  }
}

/** N.B. This is insecure but needed since the default uuidv4() results in open handle for tests */
export function insecureTestUuidv4(): string {
  const random = new Uint8Array(16);

  for (let i = 0; i < random.length; i++) {
    random[i] = Math.floor(Math.random() * 255);
  }
  return uuidv4({
    random,
  });
}

export async function safelyUpdateSchemaSpecification(
  adminClient: AdminClient,
  schemaUpdate: SchemaSpecificationUpdate,
): PromiseResult<Schema, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return await withAdvisoryLock(
    adminClient,
    'schema-update', // same name as used in withSchemaAdvisoryLock() in integration test
    { acquireInterval: 500, leaseDuration: 2_000, renewInterval: 1_000 },
    async (_advisoryLock) => {
      const result = await adminClient.updateSchemaSpecification(schemaUpdate);
      if (result.isError()) return result;
      return ok(new Schema(result.value.schemaSpecification));
    },
  );
}
