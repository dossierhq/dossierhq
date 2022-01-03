import type { ErrorType, Logger, PromiseResult } from '@jonasb/datadata-core';
import { NoOpLogger, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdapter,
  Transaction,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { TransactionContextImpl } from '@jonasb/datadata-database-adapter';
import type { TestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import type { SqliteDatabaseAdapter } from '..';
import { createSqlite3Adapter, createSqliteDatabaseAdapter, createSqlJsAdapter } from '..';

type QueryFn = SqliteDatabaseAdapter['query'];

interface MockedSqliteDatabaseAdapter extends SqliteDatabaseAdapter {
  query: jest.MockedFunction<QueryFn>;
}

class DummyContextImpl extends TransactionContextImpl<TransactionContext> {
  constructor(databaseAdapter: DatabaseAdapter, logger: Logger, transaction: Transaction | null) {
    super(databaseAdapter, logger, transaction);
  }

  protected copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction
  ): TransactionContext {
    return new DummyContextImpl(databaseAdapter, this.logger, transaction);
  }
}

export async function createSqlJsTestAdapter(): PromiseResult<
  DatabaseAdapter,
  ErrorType.BadRequest | ErrorType.Generic
> {
  const adapter = await createSqlJsAdapter();
  return createSqliteDatabaseAdapter({ logger: NoOpLogger }, adapter);
}

export async function createSqlite3TestAdapter(): PromiseResult<
  DatabaseAdapter,
  ErrorType.BadRequest | ErrorType.Generic
> {
  const adapter = await createSqlite3Adapter();
  return createSqliteDatabaseAdapter({ logger: NoOpLogger }, adapter);
}

export function registerTestSuite(testSuite: TestSuite): void {
  for (const [testName, testFunction] of Object.entries(testSuite)) {
    test(testName, testFunction as jest.ProvidesCallback);
  }
}

export async function createMockContext(
  adapter: SqliteDatabaseAdapter
): PromiseResult<TransactionContext, ErrorType.BadRequest | ErrorType.Generic> {
  const result = await createSqliteDatabaseAdapter({ logger: NoOpLogger }, adapter);
  if (result.isError()) {
    return result;
  }
  const databaseAdapter = result.value;
  return ok(new DummyContextImpl(databaseAdapter, NoOpLogger, null));
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
