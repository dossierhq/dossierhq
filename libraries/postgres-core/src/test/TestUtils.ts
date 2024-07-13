import { getPagingInfo, NoOpLogger, Schema, type Logger, type Paging } from '@dossierhq/core';
import {
  TransactionContextImpl,
  type DatabaseAdapter,
  type DatabasePagingInfo,
  type DatabasePerformanceCallbacks,
  type Transaction,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { vi, type Mock } from 'vitest';
import type { UniqueConstraints } from '../DatabaseSchema.js';
import {
  createPostgresDatabaseAdapterAdapter,
  type PostgresDatabaseAdapter,
  type PostgresQueryResult,
} from '../PostgresDatabaseAdapter.js';
import type { PostgresTransaction } from '../PostgresTransaction.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedFunction<TFn extends (...args: any[]) => any> = Mock<TFn> & TFn;

type QueryFn = PostgresDatabaseAdapter['query'];

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

interface MockedPostgresDatabaseAdapter extends PostgresDatabaseAdapter {
  queryMock: Mock<QueryFn>;
  base64Encode: MockedFunction<PostgresDatabaseAdapter['base64Encode']>;
  base64Decode: MockedFunction<PostgresDatabaseAdapter['base64Decode']>;
}

export class MockUniqueViolationOfConstraintError extends Error {
  readonly uniqueConstraint: UniqueConstraints;

  constructor(message: string, uniqueConstraint: UniqueConstraints) {
    super(message);
    this.name = 'MockUniqueViolationOfConstraintError';
    this.uniqueConstraint = uniqueConstraint;
  }
}

export function createMockContext(adapter: PostgresDatabaseAdapter): TransactionContext {
  const databaseAdapter = createPostgresDatabaseAdapterAdapter(adapter);
  return new DummyContextImpl(databaseAdapter, NoOpLogger, null, null);
}

export function createMockAdapter(): MockedPostgresDatabaseAdapter {
  const query = vi.fn<QueryFn>();

  const databaseAdapter: MockedPostgresDatabaseAdapter = {
    disconnect: vi.fn(),
    isUniqueViolationOfConstraint: (error, constraintName) =>
      error instanceof MockUniqueViolationOfConstraintError &&
      error.uniqueConstraint === constraintName,
    queryMock: query,
    query: query as MockedPostgresDatabaseAdapter['query'],
    createTransaction: () =>
      Promise.resolve({
        _type: 'Transaction',
        savePointCount: 0,
        release: vi.fn(),
      }),
    base64Encode: vi.fn(),
    base64Decode: vi.fn(),
  };

  databaseAdapter.base64Encode.mockImplementation((value) => Buffer.from(value).toString('base64'));
  databaseAdapter.base64Decode.mockImplementation((value) =>
    Buffer.from(value, 'base64').toString('utf8'),
  );

  return databaseAdapter;
}

export function mockQueryImplementation(
  adapter: MockedPostgresDatabaseAdapter,
  implementation: (
    transaction: PostgresTransaction | null,
    query: string,
    values: unknown[] | undefined,
  ) => PostgresQueryResult<unknown>,
): void {
  adapter.queryMock.mockImplementation(
    <R>(transaction: PostgresTransaction | null, query: string, values: unknown[] | undefined) =>
      Promise.resolve(implementation(transaction, query, values) as PostgresQueryResult<R>),
  );
}

export function getQueryCalls(adapter: MockedPostgresDatabaseAdapter): [string, ...unknown[]][] {
  return adapter.queryMock.mock.calls.map((call) => {
    const [_transaction, query, values] = call;
    return [query, ...(values ?? [])];
  });
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
