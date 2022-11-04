import type { Logger, Paging } from '@jonasb/datadata-core';
import { AdminSchema, getPagingInfo, NoOpLogger } from '@jonasb/datadata-core';
import type {
  DatabaseAdapter,
  DatabasePagingInfo,
  Transaction,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { TransactionContextImpl } from '@jonasb/datadata-database-adapter';
import type { SpyInstance } from 'vitest';
import { vi } from 'vitest';
import type { UniqueConstraints } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { createPostgresDatabaseAdapterAdapter } from '../PostgresDatabaseAdapter.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedFunction<TFn extends (...args: any[]) => any> = SpyInstance<
  Parameters<TFn>,
  ReturnType<TFn>
> &
  TFn;

type QueryFn = PostgresDatabaseAdapter['query'];

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

interface MockedPostgresDatabaseAdapter extends PostgresDatabaseAdapter {
  query: MockedFunction<QueryFn>;
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
  return new DummyContextImpl(databaseAdapter, NoOpLogger, null);
}

export function createMockAdapter(): MockedPostgresDatabaseAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: MockedFunction<QueryFn> = vi.fn<any, any>();

  const databaseAdapter: MockedPostgresDatabaseAdapter = {
    disconnect: vi.fn(),
    isUniqueViolationOfConstraint: (error, constraintName) =>
      error instanceof MockUniqueViolationOfConstraintError &&
      error.uniqueConstraint === constraintName,
    query,
    createTransaction: async () => ({
      _type: 'Transaction',
      savePointCount: 0,
      release: vi.fn(),
    }),
    base64Encode: vi.fn(),
    base64Decode: vi.fn(),
  };

  databaseAdapter.base64Encode.mockImplementation((value) => Buffer.from(value).toString('base64'));
  databaseAdapter.base64Decode.mockImplementation((value) =>
    Buffer.from(value, 'base64').toString('utf8')
  );

  return databaseAdapter;
}

export function getQueryCalls(adapter: MockedPostgresDatabaseAdapter): [string, ...unknown[]][] {
  return adapter.query.mock.calls.map((call) => {
    const [_transaction, query, values] = call;
    return [query, ...(values ?? [])];
  });
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
