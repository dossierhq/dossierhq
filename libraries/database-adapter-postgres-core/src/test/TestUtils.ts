import type { Logger } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import type {
  DatabaseAdapter,
  Transaction,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { TransactionContextImpl } from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '..';
import { createPostgresDatabaseAdapterAdapter } from '..';
import type { UniqueConstraints } from '../DatabaseSchema';

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
  query: jest.MockedFunction<QueryFn>;
  base64Encode: jest.MockedFunction<PostgresDatabaseAdapter['base64Encode']>;
  base64Decode: jest.MockedFunction<PostgresDatabaseAdapter['base64Decode']>;
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
  const query: jest.MockedFunction<QueryFn> = jest.fn();

  const databaseAdapter: MockedPostgresDatabaseAdapter = {
    disconnect: jest.fn(),
    isUniqueViolationOfConstraint: (error, constraintName) =>
      error instanceof MockUniqueViolationOfConstraintError &&
      error.uniqueConstraint === constraintName,
    query,
    createTransaction: async () => ({
      _type: 'Transaction',
      savePointCount: 0,
      release: jest.fn(),
    }),
    base64Encode: jest.fn(),
    base64Decode: jest.fn(),
  };

  databaseAdapter.base64Encode.mockImplementation((value) => Buffer.from(value).toString('base64'));
  databaseAdapter.base64Decode.mockImplementation((value) =>
    Buffer.from(value, 'base64').toString('ascii')
  );

  return databaseAdapter;
}

export function getQueryCalls(adapter: MockedPostgresDatabaseAdapter): [string, ...unknown[]][] {
  return adapter.query.mock.calls.map((call) => {
    const [_transaction, query, values] = call;
    return [query, ...(values ?? [])];
  });
}
