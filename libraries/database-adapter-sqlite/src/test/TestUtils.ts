import type { ErrorType, Logger, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { TestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import type { DatabaseAdapter, TransactionContext } from '@jonasb/datadata-server';
import { ServerTestUtils } from '@jonasb/datadata-server';
import type { SqliteDatabaseAdapter } from '..';
import { createSqlite3Adapter, createSqliteDatabaseAdapter, createSqlJsAdapter } from '..';

type QueryFn = SqliteDatabaseAdapter['query'];

interface MockedSqliteDatabaseAdapter extends SqliteDatabaseAdapter {
  query: jest.MockedFunction<QueryFn>;
}

export async function createSqlJsTestAdapter(): PromiseResult<
  DatabaseAdapter,
  ErrorType.BadRequest | ErrorType.Generic
> {
  const adapter = await createSqlJsAdapter();
  return createSqliteDatabaseAdapter(adapter);
}

export async function createSqlite3TestAdapter(): PromiseResult<
  DatabaseAdapter,
  ErrorType.BadRequest | ErrorType.Generic
> {
  const adapter = await createSqlite3Adapter();
  return createSqliteDatabaseAdapter(adapter);
}

export function registerTestSuite(testSuite: TestSuite): void {
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    test(testName, testFunction as jest.ProvidesCallback);
  }
}

export function createDummyLogger(): Logger {
  const noop = () => {
    //empty
  };
  return {
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
  };
}

export async function createMockContext(
  adapter: SqliteDatabaseAdapter
): PromiseResult<TransactionContext, ErrorType.BadRequest | ErrorType.Generic> {
  const result = await createSqliteDatabaseAdapter(adapter);
  if (result.isError()) {
    return result;
  }
  const databaseAdapter = result.value;
  return ok(ServerTestUtils.createDummyContext(databaseAdapter));
}

export function createMockAdapter(): MockedSqliteDatabaseAdapter {
  const query: jest.MockedFunction<QueryFn> = jest.fn();
  query.mockImplementation(async (query, _values) => {
    if (query.startsWith('SELECT sqlite_version()')) return [{ version: '3.35.0' }];
    return [];
  });

  return {
    disconnect: jest.fn(),
    query,
    isUniqueViolationOfConstraint: jest.fn().mockReturnValue(false),
  };
}

export function getQueryCalls(adapter: MockedSqliteDatabaseAdapter): [string, ...unknown[]][] {
  return adapter.query.mock.calls.map((call) => {
    const [query, values] = call;
    return [query, ...(values ?? [])];
  });
}
