import {
  EventType,
  notOk,
  type ErrorType,
  type PromiseResult,
  type SyncEvent,
} from '@dossierhq/core';
import type { DatabaseAdapter, TransactionContext } from '@dossierhq/database-adapter';
import { SYNC_EVENTS_LIMIT_MAX } from '../config/Limits.js';

export type SyncEventQuery = ({ initial: true } | { after: string }) & { limit: number };

export interface SyncEventsPayload {
  events: SyncEvent[];
  hasMore: boolean;
}

export async function managementGetSyncEvents(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  query: SyncEventQuery,
): PromiseResult<SyncEventsPayload, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const after = 'after' in query && query.after ? query.after : null;
  if (after && 'initial' in query) {
    return notOk.BadRequest('Cannot specify both "initial" and "after" in query');
  }
  if (!after && (!('initial' in query) || !query.initial)) {
    return notOk.BadRequest('Must specify "initial: true" on the initial query');
  }
  const limit = query.limit;
  if (typeof limit !== 'number') {
    return notOk.BadRequest('Must specify "limit" in query');
  }
  if (limit < 1 || limit > SYNC_EVENTS_LIMIT_MAX) {
    return notOk.BadRequest(`"limit" must be between 1 and ${SYNC_EVENTS_LIMIT_MAX}`);
  }

  const result = await databaseAdapter.managementSyncGetEvents(context, { after, limit });
  if (result.isError()) return result;

  // Normalize events
  for (const event of result.value.events) {
    if (event.type === EventType.publishEntities || event.type === EventType.unpublishEntities) {
      event.entities.sort((a, b) => a.id.localeCompare(b.id));
    }
  }

  return result;
}
