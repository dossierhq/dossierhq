import {
  EventType,
  notOk,
  type ErrorType,
  type PromiseResult,
  type SyncEvent,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import type { SessionContext } from '../Context.js';
import { schemaUpdateSpecificationSyncAction } from '../schema/schemaUpdateSpecification.js';

export async function managementApplySyncEvent(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  expectedHeadId: string | null,
  event: SyncEvent,
): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  if (!(event.createdAt instanceof Date)) {
    return notOk.BadRequest(`Expected createdAt to be a Date, but was ${typeof event.createdAt}`);
  }
  return await context.withTransaction(async (context) => {
    // Check head
    const headResult = await databaseAdapter.managementSyncGetHeadEventId(context);
    if (headResult.isError()) return headResult;

    if (expectedHeadId !== headResult.value) {
      return notOk.BadRequest(
        `Expected head event ID to be ${expectedHeadId}, but was ${headResult.value}`,
      );
    }

    // Apply event
    const { type } = event;
    switch (type) {
      case EventType.updateSchema: {
        return await schemaUpdateSpecificationSyncAction(databaseAdapter, context, event);
      }
      default:
        return notOk.BadRequest(`Unsupported event type: ${type}`);
    }
  });
}
