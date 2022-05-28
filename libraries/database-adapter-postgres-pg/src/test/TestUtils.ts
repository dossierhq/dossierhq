import type {
  AdminEntity,
  Connection,
  Edge,
  EntityHistory,
  ErrorType,
  PromiseResult,
  PublishedEntity,
  Result,
} from '@jonasb/datadata-core';
import { assertIsDefined, ok } from '@jonasb/datadata-core';
import { createMockLogger, expectOkResult, expectResultValue } from '@jonasb/datadata-core-vitest';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import {
  createTestAuthorizationAdapter,
  IntegrationTestSchemaSpecifciationUpdate,
  type TestSuite,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server, SessionContext } from '@jonasb/datadata-server';
import { createServer } from '@jonasb/datadata-server';
import { v4 as uuidv4 } from 'uuid';
import { expect, test } from 'vitest';
import { createPostgresAdapter } from '..';

export function registerTestSuite(testSuite: TestSuite): void {
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    test(testName, testFunction);
  }
}

export function createPostgresTestAdapter(): DatabaseAdapter {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return createPostgresAdapter({ connectionString: process.env.DATABASE_URL! });
}

export async function createPostgresTestServerAndClient(): PromiseResult<
  { server: Server; context: SessionContext },
  ErrorType.BadRequest | ErrorType.Generic
> {
  const serverResult = await createServer({
    databaseAdapter: createPostgresTestAdapter(),
    authorizationAdapter: createTestAuthorizationAdapter(),
    logger: createMockLogger(),
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;
  const sessionResult = await server.createSession({
    provider: 'test',
    identifier: 'identifier',
    defaultAuthKeys: ['none'],
  });
  if (sessionResult.isError()) {
    await server.shutdown(); // ignore result
    return sessionResult;
  }
  const { context } = sessionResult.value;
  return ok({ server, context });
}

export async function initializeIntegrationTestServer() {
  const serverResult = await createServer({
    databaseAdapter: createPostgresTestAdapter(),
    authorizationAdapter: createTestAuthorizationAdapter(),
    logger: createMockLogger(),
  });
  if (serverResult.isError()) {
    return serverResult;
  }
  const server = serverResult.value;

  const client = server.createAdminClient(() =>
    server.createSession({
      provider: 'test',
      identifier: 'schema-loader',
      defaultAuthKeys: ['none'],
    })
  );
  const schemaResult = await client.updateSchemaSpecification(
    IntegrationTestSchemaSpecifciationUpdate
  );
  if (schemaResult.isError()) {
    return schemaResult;
  }

  return serverResult;
}

export function expectEntityHistoryVersions(
  actual: EntityHistory,
  expectedVersions: Omit<EntityHistory['versions'][0], 'createdAt'>[]
): void {
  // Skip createdAt since dates are unpredictable
  const actualVersions = actual.versions.map((x) => {
    const { createdAt: _createdAt, ...version } = x;
    return version;
  });
  expect(actualVersions).toEqual(expectedVersions);
}

export function expectSearchResultEntities<TItem extends AdminEntity | PublishedEntity>(
  result: Result<
    Connection<Edge<TItem, ErrorType>> | null,
    ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
  >,
  actualEntities: TItem[]
): void {
  if (expectOkResult(result)) {
    if (actualEntities.length === 0) {
      expect(result.value).toBeNull();
    } else {
      assertIsDefined(result.value);
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
