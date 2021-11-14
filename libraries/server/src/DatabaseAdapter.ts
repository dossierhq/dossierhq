import type { ErrorType, PromiseResult, AdminSchemaSpecification } from '@jonasb/datadata-core';
import type { Session, TransactionContext } from '.';

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

  schemaGetSpecification(
    context: TransactionContext
  ): PromiseResult<AdminSchemaSpecification | null, ErrorType.Generic>;

  schemaUpdateSpecification(
    context: TransactionContext,
    schemaSpec: AdminSchemaSpecification
  ): PromiseResult<void, ErrorType.Generic>;

  // TODO remove when migrated away
  queryLegacy<R = unknown>(
    transaction: Transaction | null,
    query: string,
    values: unknown[] | undefined
  ): Promise<R[]>;

  //TODO remove when migrated away
  isUniqueViolationOfConstraint(error: unknown, constraintName: string): boolean;
}
