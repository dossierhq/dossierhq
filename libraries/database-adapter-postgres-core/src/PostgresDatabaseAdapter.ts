import type { DatabaseAdapter } from '@jonasb/datadata-server';
import type { PostgresTransaction } from '.';
import { authCreatePrincipal } from './auth/createPrincipal';
import { authCreateSession } from './auth/createSession';
import { withNestedTransaction, withRootTransaction } from './PostgresTransaction';
import { schemaGetSpecification } from './schema/getSpecification';

export interface PostgresDatabaseAdapter {
  disconnect(): Promise<void>;

  createTransaction(): Promise<PostgresTransaction>;

  query<R>(
    transaction: PostgresTransaction | null,
    query: string,
    values: unknown[] | undefined
  ): Promise<R[]>;

  isUniqueViolationOfConstraint(error: unknown, constraintName: string): boolean;
}

export function createPostgresDatabaseAdapterAdapter(
  databaseAdapter: PostgresDatabaseAdapter
): DatabaseAdapter {
  return {
    disconnect: databaseAdapter.disconnect,
    withRootTransaction: (...args) => withRootTransaction(databaseAdapter, ...args),
    withNestedTransaction: (...args) => withNestedTransaction(databaseAdapter, ...args),
    queryLegacy: databaseAdapter.query,
    isUniqueViolationOfConstraint: databaseAdapter.isUniqueViolationOfConstraint,
    authCreateSession: (...args) => authCreateSession(databaseAdapter, ...args),
    authCreatePrincipal: (...args) => authCreatePrincipal(databaseAdapter, ...args),
    schemaGetSpecification: (...args) => schemaGetSpecification(databaseAdapter, ...args),
  };
}
