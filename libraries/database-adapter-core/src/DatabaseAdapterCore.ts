import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';

export interface DatabaseAdapter {
  disconnect(): Promise<void>;

  withRootTransaction<TOk, TError extends ErrorType>(
    callback: (queryable: Queryable) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;

  withNestedTransaction<TOk, TError extends ErrorType>(
    queryable: Queryable,
    callback: () => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;

  query<R = unknown>(
    transactionQueryable: Queryable | null,
    query: string,
    values: unknown[] | undefined
  ): Promise<R[]>;

  isUniqueViolationOfConstraint(error: unknown, constraintName: string): boolean;
}

export interface Queryable {
  _type: 'Queryable';
}
