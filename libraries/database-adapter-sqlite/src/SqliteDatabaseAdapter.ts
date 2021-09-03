import type { DatabaseAdapter } from '@jonasb/datadata-server';
import { authCreatePrincipal } from './auth/createPrincipal';

export type ColumnValue = number | string | Uint8Array | null;

export interface SqliteDatabaseAdapter {
  disconnect(): Promise<void>;
  query<R>(query: string, values: ColumnValue[] | undefined): R[];
}

export function createSqliteDatabaseAdapter(adapter: SqliteDatabaseAdapter): DatabaseAdapter {
  return {
    disconnect: adapter.disconnect,
    withRootTransaction: () => {
      throw new Error('TODO');
    },
    withNestedTransaction: () => {
      throw new Error('TODO');
    },
    queryLegacy: () => {
      throw new Error('TODO');
    },
    isUniqueViolationOfConstraint: () => {
      throw new Error('TODO');
    },
    authCreatePrincipal: (...args) => Promise.resolve(authCreatePrincipal(adapter, ...args)),
  };
}
