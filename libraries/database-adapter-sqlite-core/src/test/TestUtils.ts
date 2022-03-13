import type { ErrorType, Logger, PromiseResult } from '@jonasb/datadata-core';
import { AdminSchema, NoOpLogger, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdapter,
  Transaction,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { TransactionContextImpl } from '@jonasb/datadata-database-adapter';
import type { SqliteDatabaseAdapter } from '..';
import { createSqliteDatabaseAdapterAdapter } from '..';

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

export async function createMockContext(
  adapter: SqliteDatabaseAdapter
): PromiseResult<TransactionContext, ErrorType.BadRequest | ErrorType.Generic> {
  const result = await createSqliteDatabaseAdapterAdapter({ logger: NoOpLogger }, adapter);
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
    if (query === 'PRAGMA user_version') return [{ user_version: 999 }]; // high number to avoid migrations
    return [];
  });

  const mockAdapter = {
    disconnect: jest.fn(),
    query,
    isUniqueViolationOfConstraint: jest.fn().mockReturnValue(false),
    base64Encode: jest.fn(),
    base64Decode: jest.fn(),
  };

  mockAdapter.base64Encode.mockImplementation((value) => Buffer.from(value).toString('base64'));
  mockAdapter.base64Decode.mockImplementation((value) =>
    Buffer.from(value, 'base64').toString('ascii')
  );

  return mockAdapter;
}

export function getQueryCalls(adapter: MockedSqliteDatabaseAdapter): [string, ...unknown[]][] {
  return adapter.query.mock.calls.map((call) => {
    const [query, values] = call;
    return [query, ...(values ?? [])];
  });
}

export function createTestAdminSchema(): AdminSchema {
  return new AdminSchema({ entityTypes: [], valueTypes: [] });
}
