import type { Temporal } from '@js-temporal/polyfill';
import type {
  ErrorType,
  PromiseResult,
  AdminSchemaSpecification,
  Location,
} from '@jonasb/datadata-core';
import type { ResolvedAuthKey, Session, TransactionContext } from '.';

export interface Transaction {
  _type: 'Transaction';
}

export interface DatabaseAuthCreateSessionPayload {
  principalEffect: 'created' | 'none';
  session: Session;
}

export interface DatabaseAdminEntityCreateEntityArg {
  id: string | null;
  type: string;
  name: string;
  creator: Session;
  resolvedAuthKey: ResolvedAuthKey;
  fullTextSearchText: string;
  locations: Location[];
  referenceIds: number[];
  fieldsData: Record<string, unknown>;
}

export interface DatabaseAdminEntityCreatePayload {
  id: string;
  name: string;
  createdAt: Temporal.Instant;
  updatedAt: Temporal.Instant;
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
  ): PromiseResult<DatabaseAuthCreateSessionPayload, ErrorType.Generic>;

  schemaGetSpecification(
    context: TransactionContext
  ): PromiseResult<AdminSchemaSpecification | null, ErrorType.Generic>;

  schemaUpdateSpecification(
    context: TransactionContext,
    schemaSpec: AdminSchemaSpecification
  ): PromiseResult<void, ErrorType.Generic>;

  adminEntityCreate(
    context: TransactionContext,
    randomNameGenerator: (name: string) => string,
    entity: DatabaseAdminEntityCreateEntityArg
  ): PromiseResult<DatabaseAdminEntityCreatePayload, ErrorType.Conflict | ErrorType.Generic>;

  // TODO remove when migrated away
  queryLegacy<R = unknown>(
    transaction: Transaction | null,
    query: string,
    values: unknown[] | undefined
  ): Promise<R[]>;

  //TODO remove when migrated away
  isUniqueViolationOfConstraint(error: unknown, constraintName: string): boolean;
}
