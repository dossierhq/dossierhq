import { notOk, type ErrorType, type PromiseResult, type SyncEvent } from '@dossierhq/core';
import type { DatabaseAdapter, TransactionContext } from '@dossierhq/database-adapter';

export async function managementApplySyncEvent(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  expectedHeadId: string | null,
  event: SyncEvent,
): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  return await context.withTransaction(async (context) => {
    const headResult = await databaseAdapter.managementSyncGetHeadEventId(context);
    if (headResult.isError()) return headResult;

    if (expectedHeadId !== headResult.value) {
      return notOk.BadRequest(
        `Expected head event ID to be ${expectedHeadId}, but was ${headResult.value}`,
      );
    }

    const { type } = event;
    switch (type) {
      default:
        return notOk.BadRequest(`Unsupported event type: ${type}`);
    }
  });
}
