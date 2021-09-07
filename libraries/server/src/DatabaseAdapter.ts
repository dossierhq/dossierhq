import type { ErrorType, PromiseResult, SchemaSpecification } from '@jonasb/datadata-core';
import type { Context, Session, TransactionContext } from '.';

export interface Transaction {
  _type: 'Transaction';
}

export interface AuthCreateSessionPayload {
  principalEffect: 'created' | 'none';
  session: Session;
}

export interface DatabaseAdapter {
  disconnect(): Promise<void>;

  withRootTransaction<TOk, TError extends ErrorType>(
    callback: (transaction: Transaction) => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;

  withNestedTransaction<TOk, TError extends ErrorType>(
    transaction: Transaction,
    callback: () => PromiseResult<TOk, TError>
  ): PromiseResult<TOk, TError>;

  authCreateSession(
    context: TransactionContext,
    provider: string,
    identifier: string
  ): PromiseResult<AuthCreateSessionPayload, ErrorType.Generic>;

  authCreatePrincipal(
    context: Context,
    provider: string,
    identifier: string
  ): PromiseResult<Session, ErrorType.Conflict | ErrorType.Generic>;

  schemaGetSpecification(
    context: TransactionContext
  ): PromiseResult<SchemaSpecification | null, ErrorType.Generic>;

  // TODO remove when migrated away
  queryLegacy<R = unknown>(
    transaction: Transaction | null,
    query: string,
    values: unknown[] | undefined
  ): Promise<R[]>;

  //TODO remove when migrated away
  isUniqueViolationOfConstraint(error: unknown, constraintName: string): boolean;
}
