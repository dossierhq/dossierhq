import type { TransactionContext } from '@jonasb/datadata-server';
import { ServerTestUtils } from '@jonasb/datadata-server';
import type { PostgresDatabaseAdapter } from '.';
import { createPostgresDatabaseAdapterAdapter } from '.';
import type { UniqueConstraints } from './DatabaseSchema';

type QueryFn = PostgresDatabaseAdapter['query'];

interface MockedPostgresDatabaseAdapter extends PostgresDatabaseAdapter {
  query: jest.MockedFunction<QueryFn>;
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
  return ServerTestUtils.createDummyContext(databaseAdapter);
}

export function createMockAdapter(): MockedPostgresDatabaseAdapter {
  const query: jest.MockedFunction<QueryFn> = jest.fn();
  return {
    disconnect: jest.fn(),
    isUniqueViolationOfConstraint: (error, constraintName) =>
      error instanceof MockUniqueViolationOfConstraintError &&
      error.uniqueConstraint === constraintName,
    query,
    createTransaction: async () => ({ _type: 'Transaction', release: jest.fn() }),
  };
}

export function getQueryCalls(adapter: MockedPostgresDatabaseAdapter): [string, ...unknown[]][] {
  return adapter.query.mock.calls.map((call) => {
    const [_transaction, query, values] = call;
    return [query, ...(values ?? [])];
  });
}
