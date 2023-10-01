import type { ErrorType, PromiseResult } from '@dossierhq/core';
import type { DatabaseAdapter, TransactionContext } from '@dossierhq/database-adapter';
import type { SyncPrincipal } from '../Server.js';

export function authCreatePrincipal(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  principal: SyncPrincipal,
): PromiseResult<
  { effect: 'created' | 'none' },
  typeof ErrorType.Conflict | typeof ErrorType.Generic
> {
  return databaseAdapter.authCreatePrincipal(context, principal);
}
