import type { Context, Server, Transaction } from '@jonasb/datadata-server';
import { ServerTestUtils } from '@jonasb/datadata-server';
import { createPostgresDatabaseAdapterAdapter, PostgresDatabaseAdapter } from '.';
import type { ErrorType, PromiseResult } from '../../core/lib/cjs';
import type { UniqueConstraints } from './DatabaseSchema';

type QueryFn = PostgresDatabaseAdapter['query'];

interface MockedPostgresDatabaseAdapter extends PostgresDatabaseAdapter {
  query: jest.MockedFunction<QueryFn>;
}

interface TransactionWrapper extends Transaction {
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
    withNestedTransaction: (transaction, callback) =>
      withNestedTransaction(query, transaction, callback),
    withRootTransaction: (callback) => withRootTransaction(query, callback),
  };
}

export function getQueryCalls(adapter: MockedPostgresDatabaseAdapter) {
  return adapter.query.mock.calls.map((call) => {
    const [_transaction, query, values] = call;
    return [query, ...(values ?? [])];
  });
}

//TODO would it make sense to move these to createPostgresDatabaseAdapterAdapter(), instead of relying on sub adapter behavior
async function withRootTransaction<TOk, TError extends ErrorType>(
  query: QueryFn,
  callback: (transaction: Transaction) => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError> {
  const transaction: TransactionWrapper = { _type: 'Transaction', wrapped: query };
  try {
    await query(transaction, 'BEGIN', undefined);
    const result = await callback(transaction);
    if (result.isOk()) {
      await query(transaction, 'COMMIT', undefined);
    } else {
      await query(transaction, 'ROLLBACK', undefined);
    }
    return result;
  } catch (e) {
    await query(transaction, 'ROLLBACK', undefined);
    throw e;
  }
}

async function withNestedTransaction<TOk, TError extends ErrorType>(
  query: QueryFn,
  transaction: Transaction,
  callback: () => PromiseResult<TOk, TError>
): PromiseResult<TOk, TError> {
  try {
    await query(transaction, 'BEGIN', undefined);
    const result = await callback();
    if (result.isOk()) {
      await query(transaction, 'COMMIT', undefined);
    } else {
      await query(transaction, 'ROLLBACK', undefined);
    }
    return result;
  } catch (e) {
    await query(transaction, 'ROLLBACK', undefined);
    throw e;
  }
}
