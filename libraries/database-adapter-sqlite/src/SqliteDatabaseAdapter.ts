import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-server';
import type { UniqueConstraint } from '.';
import { authCreatePrincipal } from './auth/createPrincipal';
import { queryOne } from './QueryFunctions';
import { isSemVerEqualOrGreaterThan, parseSemVer } from './SemVer';
import { withNestedTransaction, withRootTransaction } from './SqliteTransaction';

export type ColumnValue = number | string | Uint8Array | null;

const minimumSupportedVersion = { major: 3, minor: 35, patch: 0 };

export interface SqliteDatabaseAdapter {
  disconnect(): Promise<void>;
  query<R>(query: string, values: ColumnValue[] | undefined): Promise<R[]>;
  isUniqueViolationOfConstraint(error: unknown, constraint: UniqueConstraint): boolean;
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
  const isSupported = isSemVerEqualOrGreaterThan(parseSemVer(version), minimumSupportedVersion);
  if (!isSupported) {
    return notOk.BadRequest(
      `Database is using sqlite ${version}, (${minimumSupportedVersion.major}.${minimumSupportedVersion.minor}.${minimumSupportedVersion.patch}+ required)`
    );
  }
  return ok(undefined);
}
