import { notOk, type ErrorType, type PromiseResult, type SyncEvent } from '@dossierhq/core';
import type { DatabaseAdapter, TransactionContext } from '@dossierhq/database-adapter';

export async function managementApplySyncEvents(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  expectedHeadId: string | null,
  events: SyncEvent[],
): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return Promise.resolve(notOk.Generic('Not implemented'));
}
