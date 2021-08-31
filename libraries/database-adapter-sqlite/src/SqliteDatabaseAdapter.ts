import type { DatabaseAdapter } from '@jonasb/datadata-server';

export function createSqliteDatabaseAdapter(): DatabaseAdapter {
  return {
    disconnect: () => {
      throw new Error('TODO');
    },
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
    authCreatePrincipal: () => {
      throw new Error('TODO');
    },
  };
}
