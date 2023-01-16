import type { ErrorType, Logger, Paging, PromiseResult } from '@dossierhq/core';
import { AdminSchema, getPagingInfo, NoOpLogger, ok } from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabasePagingInfo,
  Transaction,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { TransactionContextImpl } from '@dossierhq/database-adapter';
import { randomUUID } from 'node:crypto';
import type { SpyInstance } from 'vitest';
import { vi } from 'vitest';
import { REQUIRED_SCHEMA_VERSION } from '../SchemaDefinition.js';
import type { ColumnValue, SqliteDatabaseAdapter } from '../SqliteDatabaseAdapter.js';
import { createSqliteDatabaseAdapterAdapter } from '../SqliteDatabaseAdapter.js';
import { Mutex } from '../utils/MutexUtils.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedFunction<TFn extends (...args: any[]) => any> = SpyInstance<
  Parameters<TFn>,
  ReturnType<TFn>
> &
  TFn;

type QueryFn = SqliteDatabaseAdapter['query'];

interface MockedSqliteDatabaseAdapter extends SqliteDatabaseAdapter {
  allQueries: [string, ...ColumnValue[]][];
  clearAllQueries(): void;
  mockQuery?: (query: string, values: ColumnValue[] | undefined) => unknown[] | undefined;

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
  const allQueries: [string, ...ColumnValue[]][] = [];

  const mockAdapter: MockedSqliteDatabaseAdapter = {
    allQueries,
    clearAllQueries: () => {
      allQueries.length = 0;
    },
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

  mockAdapter.query.mockImplementation(async (query, values) => {
    allQueries.push([query, ...(values ?? [])]);

    if (mockAdapter.mockQuery) {
      const result = mockAdapter.mockQuery(query, values);
      if (result) return result;
    }

    if (query.startsWith('SELECT sqlite_version()')) return [{ version: '3.37.0' }];
    if (query === 'PRAGMA user_version') return [{ user_version: REQUIRED_SCHEMA_VERSION }]; // prevent migration
    return [];
  });

  mockAdapter.run.mockImplementation(async (query, values) => {
    allQueries.push([query, ...(values ?? [])]);
  });

  mockAdapter.encodeCursor.mockImplementation((value) => Buffer.from(value).toString('base64'));
  mockAdapter.decodeCursor.mockImplementation((value) =>
    Buffer.from(value, 'base64').toString('utf8')
  );
  mockAdapter.randomUUID.mockImplementation(randomUUID);

  return mockAdapter;
}

export function getRunAndQueryCalls(
  adapter: MockedSqliteDatabaseAdapter
): [string, ...ColumnValue[]][] {
  return adapter.allQueries;
}

export function createTestAdminSchema(): AdminSchema {
  return AdminSchema.createAndValidate({}).valueOrThrow();
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
