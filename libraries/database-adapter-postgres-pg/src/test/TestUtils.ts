import type {
  AdminEntity,
  Connection,
  Edge,
  Entity,
  EntityHistory,
  ErrorType,
  Logger,
  PromiseResult,
  Result,
} from '@jonasb/datadata-core';
import { assertIsDefined, CoreTestUtils, ok } from '@jonasb/datadata-core';
import type { TestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import { createTestAuthenticationAdapter } from '@jonasb/datadata-database-adapter-test-integration';
import type { DatabaseAdapter, Server, SessionContext } from '@jonasb/datadata-server';
import { createServer } from '@jonasb/datadata-server';
import { Temporal } from '@js-temporal/polyfill';
import { v4 as uuidv4 } from 'uuid';
import { createPostgresAdapter } from '..';

const { expectOkResult } = CoreTestUtils;

export function registerTestSuite(testSuite: TestSuite): void {
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    test(testName, testFunction as jest.ProvidesCallback);
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
    authenticationAdapter: createTestAuthenticationAdapter(),
    logger: createMockLogger(),
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;
  const sessionResult = await server.createSession('test', 'identifier');
  if (sessionResult.isError()) {
    await server.shutdown(); // ignore result
    return sessionResult;
  }
  const { context } = sessionResult.value;
  return ok({ server, context });
}

export function createMockLogger(): Logger {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

export function expectResultValue<TOk, TError extends ErrorType>(
  result: Result<TOk, TError>,
  expectedValue: TOk
): void {
  if (expectOkResult(result)) {
    const actualCopy = deepCopyForIsEqual(result.value);
    const expectedCopy = deepCopyForIsEqual(expectedValue);
    expect(actualCopy).toEqual<TOk>(expectedCopy);
  }
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

export function expectSearchResultEntities<TItem extends AdminEntity | Entity>(
  result: Result<
    Connection<Edge<TItem, ErrorType>> | null,
    ErrorType.BadRequest | ErrorType.Generic
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

function deepCopyForIsEqual<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Temporal.Instant) {
    // Since the epoch isn't stored as a property for Instant (but a slot), jest isn't able to compare them.
    // Replace with string representation
    return obj.toString() as unknown as T;
  }
  if (typeof obj === 'object') {
    const copy = { ...obj };
    for (const [key, value] of Object.entries(obj)) {
      copy[key as keyof T] = deepCopyForIsEqual(value);
    }
    return copy;
  }
  return obj;
}
