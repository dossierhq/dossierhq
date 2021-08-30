import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { DatabaseAdapter, Queryable } from '@jonasb/datadata-server';
import { authCreatePrincipal } from './auth/createPrincipal';

export interface PostgresDatabaseAdapter {
  disconnect(): Promise<void>;

  withRootTransaction<TOk, TError extends ErrorType>(
    callback: (queryable: Queryable) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;

  withNestedTransaction<TOk, TError extends ErrorType>(
    queryable: Queryable,
    callback: () => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;

  query<R>(
    transactionQueryable: Queryable | null,
    query: string,
    values: unknown[] | undefined
  ): Promise<R[]>;

  //TODO remove from everywhere
  isUniqueViolationOfConstraint(error: unknown, constraintName: string): boolean;
}

export function createPostgresDatabaseAdapterAdapter(
  databaseAdapter: PostgresDatabaseAdapter
): DatabaseAdapter {
  return {
    disconnect: databaseAdapter.disconnect,
    withRootTransaction: databaseAdapter.withRootTransaction,
    withNestedTransaction: databaseAdapter.withNestedTransaction,
    queryLegacy: databaseAdapter.query,
    isUniqueViolationOfConstraint: databaseAdapter.isUniqueViolationOfConstraint,
    authCreatePrincipal: (...args) => authCreatePrincipal(databaseAdapter, ...args),
  };
}
