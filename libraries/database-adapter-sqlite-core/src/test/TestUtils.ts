import type { ErrorType, Logger, Paging, PromiseResult } from '@jonasb/datadata-core';
import { AdminSchema, getPagingInfo, NoOpLogger, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdapter,
  DatabasePagingInfo,
  Transaction,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { TransactionContextImpl } from '@jonasb/datadata-database-adapter';
import type { SqliteDatabaseAdapter } from '..';
import { createSqliteDatabaseAdapterAdapter } from '..';
import { Mutex } from '../utils/MutexUtils';

type QueryFn = SqliteDatabaseAdapter['query'];

interface MockedSqliteDatabaseAdapter extends SqliteDatabaseAdapter {
  query: jest.MockedFunction<QueryFn>;
}

interface MockedDatabase {
  mutex: Mutex;
  adapter: MockedSqliteDatabaseAdapter;
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

export async function createMockInnerAndOuterAdapter(): PromiseResult<
  { innerAdapter: MockedSqliteDatabaseAdapter; outerAdapter: DatabaseAdapter },
  ErrorType.BadRequest | ErrorType.Generic
> {
  const innerAdapter = createMockInnerAdapter();
  const result = await createSqliteDatabaseAdapterAdapter({ logger: NoOpLogger }, innerAdapter);
  if (result.isError()) return result;
  return ok({ innerAdapter, outerAdapter: result.value });
}

export function createMockContext(adapter: DatabaseAdapter): TransactionContext {
  return new DummyContextImpl(adapter, NoOpLogger, null);
}

/** Used when unit testing functions not needing the full SqliteAdapter */
export function createMockDatabase(): MockedDatabase {
  return {
    mutex: new Mutex(),
    adapter: createMockInnerAdapter(),
  };
}

export function createMockInnerAdapter(): MockedSqliteDatabaseAdapter {
  const query: jest.MockedFunction<QueryFn> = jest.fn();
  query.mockImplementation(async (query, _values) => {
    if (query.startsWith('SELECT sqlite_version()')) return [{ version: '3.35.0' }];
    if (query === 'PRAGMA user_version') return [{ user_version: 999 }]; // high number to avoid migrations
    return [];
  });

  const mockAdapter = {
    disconnect: jest.fn(),
    query,
    isFtsVirtualTableConstraintFailed: jest.fn().mockReturnValue(false),
    isUniqueViolationOfConstraint: jest.fn().mockReturnValue(false),
    encodeCursor: jest.fn(),
    decodeCursor: jest.fn(),
  };

  mockAdapter.encodeCursor.mockImplementation((value) => Buffer.from(value).toString('base64'));
  mockAdapter.decodeCursor.mockImplementation((value) =>
    Buffer.from(value, 'base64').toString('utf8')
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

export function resolvePaging(
  paging: Paging | undefined,
  inclusive?: { afterInclusive?: boolean; beforeInclusive?: boolean }
): DatabasePagingInfo {
  const pagingInfo = getPagingInfo(paging).valueOrThrow();
  return {
    ...pagingInfo,
    count: pagingInfo.count ?? 25,
    after: paging?.after ?? null,
    afterInclusive: inclusive?.afterInclusive ?? false,
    before: paging?.before ?? null,
    beforeInclusive: inclusive?.beforeInclusive ?? false,
  };
}
