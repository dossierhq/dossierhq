import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { Context, Session } from '.';

export interface DatabaseAdapter {
  disconnect(): Promise<void>;

  withRootTransaction<TOk, TError extends ErrorType>(
    callback: (queryable: Queryable) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;

  withNestedTransaction<TOk, TError extends ErrorType>(
    queryable: Queryable,
    callback: () => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;

  authCreatePrincipal(
    context: Context,
    provider: string,
    identifier: string
  ): PromiseResult<Session, ErrorType.Conflict | ErrorType.Generic>;

  // TODO remove when migrated away
  queryLegacy<R = unknown>(
    transactionQueryable: Queryable | null,
    query: string,
    values: unknown[] | undefined
  ): Promise<R[]>;

  //TODO remove when migrated away
  isUniqueViolationOfConstraint(error: unknown, constraintName: string): boolean;
}

export interface Queryable {
  _type: 'Queryable';
}
