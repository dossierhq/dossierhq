import type { Context, Server } from '@jonasb/datadata-server';
import { ServerTestUtils } from '@jonasb/datadata-server';
import type { PostgresTransaction } from '.';
import { createPostgresDatabaseAdapterAdapter, PostgresDatabaseAdapter } from '.';
import type { UniqueConstraints } from './DatabaseSchema';

type QueryFn = PostgresDatabaseAdapter['query'];

interface MockedPostgresDatabaseAdapter extends PostgresDatabaseAdapter {
  query: jest.MockedFunction<QueryFn>;
}

interface TransactionWrapper extends PostgresTransaction {
  wrapped: QueryFn;
}

export class MockUniqueViolationOfConstraintError extends Error {
  readonly uniqueConstraint: UniqueConstraints;

  constructor(message: string, uniqueConstraint: UniqueConstraints) {
    super(message);
    this.name = 'MockUniqueViolationOfConstraintError';
    this.uniqueConstraint = uniqueConstraint;
  }
}

export function createMockContext(adapter: PostgresDatabaseAdapter): Context {
  const databaseAdapter = createPostgresDatabaseAdapterAdapter(adapter);
  //TODO server
  return ServerTestUtils.createDummyContext(jest.fn() as unknown as Server, databaseAdapter);
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

export function getQueryCalls(adapter: MockedPostgresDatabaseAdapter) {
  return adapter.query.mock.calls.map((call) => {
    const [_transaction, query, values] = call;
    return [query, ...(values ?? [])];
  });
}
