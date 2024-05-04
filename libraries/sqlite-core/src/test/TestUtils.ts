import { randomUUID } from 'node:crypto';
import {
  getPagingInfo,
  NoOpLogger,
  ok,
  Schema,
  type ErrorType,
  type Logger,
  type Paging,
  type PromiseResult,
} from '@dossierhq/core';
import {
  TransactionContextImpl,
  type DatabaseAdapter,
  type DatabasePagingInfo,
  type DatabasePerformanceCallbacks,
  type Transaction,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { vi, type MockInstance } from 'vitest';
import { REQUIRED_SCHEMA_VERSION } from '../SchemaDefinition.js';
import {
  createSqliteDatabaseAdapterAdapter,
  type ColumnValue,
  type SqliteDatabaseAdapter,
} from '../SqliteDatabaseAdapter.js';
import { Mutex } from '../utils/MutexUtils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedFunction<TFn extends (...args: any[]) => any> = MockInstance<
  Parameters<TFn>,
  ReturnType<TFn>
> &
  TFn;

type QueryFn = SqliteDatabaseAdapter['query'];

interface MockedSqliteDatabaseAdapter extends SqliteDatabaseAdapter {
  allQueries: [string, ...ColumnValue[]][];
  clearAllQueries(): void;
  mockQuery?: (query: string, values: ColumnValue[] | undefined) => unknown[] | undefined;

  createTransaction: MockedFunction<SqliteDatabaseAdapter['createTransaction']>;
  query: MockedFunction<QueryFn>;
  run: MockedFunction<SqliteDatabaseAdapter['run']>;
  encodeCursor: MockedFunction<SqliteDatabaseAdapter['encodeCursor']>;
  decodeCursor: MockedFunction<SqliteDatabaseAdapter['decodeCursor']>;
  randomUUID: MockedFunction<SqliteDatabaseAdapter['randomUUID']>;
}

interface MockedDatabase {
  mutex: Mutex;
  adapter: MockedSqliteDatabaseAdapter;
}

class DummyContextImpl extends TransactionContextImpl<TransactionContext> {
  constructor(
    databaseAdapter: DatabaseAdapter,
    logger: Logger,
    databasePerformance: DatabasePerformanceCallbacks | null,
    transaction: Transaction | null,
  ) {
    super(databaseAdapter, logger, databasePerformance, transaction);
  }

  protected copyWithNewTransaction(
    databaseAdapter: DatabaseAdapter,
    transaction: Transaction,
  ): TransactionContext {
    return new DummyContextImpl(
      databaseAdapter,
      this.logger,
      this.databasePerformance,
      transaction,
    );
  }
}

export async function createMockInnerAndOuterAdapter(): PromiseResult<
  { innerAdapter: MockedSqliteDatabaseAdapter; outerAdapter: DatabaseAdapter },
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const innerAdapter = createMockInnerAdapter();
  const result = await createSqliteDatabaseAdapterAdapter({ logger: NoOpLogger }, innerAdapter, {
    migrate: false,
  });
  if (result.isError()) return result;
  return ok({ innerAdapter, outerAdapter: result.value });
}

export function createMockContext(adapter: DatabaseAdapter): TransactionContext {
  return new DummyContextImpl(adapter, NoOpLogger, null, null);
}

/** Used when unit testing functions not needing the full SqliteAdapter */
export function createMockDatabase(): MockedDatabase {
  return {
    mutex: new Mutex(),
    adapter: createMockInnerAdapter(),
  };
}

export function createMockInnerAdapter(): MockedSqliteDatabaseAdapter {
  const allQueries: [string, ...ColumnValue[]][] = [];

  const mockAdapter: MockedSqliteDatabaseAdapter = {
    allQueries,
    clearAllQueries: () => {
      allQueries.length = 0;
    },
    createTransaction: vi.fn(),
    disconnect: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: vi.fn<any, any>(),
    run: vi.fn(),
    isFtsVirtualTableConstraintFailed: vi.fn().mockReturnValue(false),
    isUniqueViolationOfConstraint: vi.fn().mockReturnValue(false),
    encodeCursor: vi.fn(),
    decodeCursor: vi.fn(),
    randomUUID: vi.fn(),
  };

  mockAdapter.createTransaction.mockImplementation(() => {
    return {
      begin() {
        allQueries.push(['BEGIN']);
        return Promise.resolve(undefined);
      },
      rollback() {
        allQueries.push(['ROLLBACK']);
        return Promise.resolve(undefined);
      },
      commit() {
        allQueries.push(['COMMIT']);
        return Promise.resolve(undefined);
      },
      close() {
        // empty
      },
    };
  });

  mockAdapter.query.mockImplementation((_transaction, query, values) => {
    allQueries.push([query, ...(values ?? [])]);

    let result: unknown[] | undefined;
    if (mockAdapter.mockQuery) {
      result = mockAdapter.mockQuery(query, values);
    }
    if (!result) {
      if (query.startsWith('SELECT sqlite_version()')) {
        result = [{ version: '3.37.0' }];
      } else if (query === 'PRAGMA user_version') {
        result = [{ user_version: REQUIRED_SCHEMA_VERSION }]; // prevent migration
      } else if (query === 'PRAGMA foreign_keys') {
        result = [{ foreign_keys: 0 }]; // turned off by default for each connection
      } else {
        result = [];
      }
    }
    return Promise.resolve(result);
  });

  mockAdapter.run.mockImplementation((transaction, query, values) => {
    allQueries.push([query, ...(values ?? [])]);
    return Promise.resolve(0);
  });

  mockAdapter.encodeCursor.mockImplementation((value) => Buffer.from(value).toString('base64'));
  mockAdapter.decodeCursor.mockImplementation((value) =>
    Buffer.from(value, 'base64').toString('utf8'),
  );
  mockAdapter.randomUUID.mockImplementation(randomUUID);

  return mockAdapter;
}

export function getRunAndQueryCalls(
  adapter: MockedSqliteDatabaseAdapter,
): [string, ...ColumnValue[]][] {
  return adapter.allQueries;
}

export function createTestAdminSchema(): Schema {
  return Schema.createAndValidate({}).valueOrThrow();
}

export function resolvePaging(
  paging: Paging | undefined,
  inclusive?: { afterInclusive?: boolean; beforeInclusive?: boolean },
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
