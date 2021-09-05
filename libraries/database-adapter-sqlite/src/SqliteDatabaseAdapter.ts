import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-server';
import { authCreatePrincipal } from './auth/createPrincipal';
import { queryOne } from './QueryFunctions';
import { withNestedTransaction, withRootTransaction } from './SqliteTransaction';

export type ColumnValue = number | string | Uint8Array | null;

export interface SqliteDatabaseAdapter {
  disconnect(): Promise<void>;
  query<R>(query: string, values: ColumnValue[] | undefined): Promise<R[]>;
}

export async function createSqliteDatabaseAdapter(
  sqliteAdapter: SqliteDatabaseAdapter
): PromiseResult<DatabaseAdapter, ErrorType.BadRequest | ErrorType.Generic> {
  const validityResult = await checkAdapterValidity(sqliteAdapter);
  if (validityResult.isError()) {
    return validityResult;
  }

  const adapter: DatabaseAdapter = {
    disconnect: sqliteAdapter.disconnect,
    withRootTransaction: (...args) => withRootTransaction(sqliteAdapter, ...args),
    withNestedTransaction: (...args) => withNestedTransaction(sqliteAdapter, ...args),
    queryLegacy: () => {
      throw new Error('TODO');
    },
    isUniqueViolationOfConstraint: () => {
      throw new Error('TODO');
    },
    authCreatePrincipal: (...args) => Promise.resolve(authCreatePrincipal(sqliteAdapter, ...args)),
  };
  return ok(adapter);
}

async function checkAdapterValidity(
  adapter: SqliteDatabaseAdapter
): PromiseResult<void, ErrorType.Generic | ErrorType.BadRequest> {
  const result = await queryOne<{ version: string }>(
    adapter,
    'SELECT sqlite_version() AS version',
    undefined
  );
  if (result.isError()) {
    return result;
  }
  const { version } = result.value;
  if (version !== '3.35.0') {
    return notOk.BadRequest(
      `Database is using sqlite ${version}, ${'3.35.0'} or later is required`
    );
  }
  return ok(undefined);
}
