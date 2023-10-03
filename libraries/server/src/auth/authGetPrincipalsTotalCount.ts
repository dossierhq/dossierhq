import type { ErrorType, PromiseResult } from '@dossierhq/core';
import type { DatabaseAdapter, TransactionContext } from '@dossierhq/database-adapter';

export function autGetPrincipalsTotalCount(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
): PromiseResult<number, typeof ErrorType.Generic> {
  return databaseAdapter.authGetPrincipalsTotalCount(context);
}
