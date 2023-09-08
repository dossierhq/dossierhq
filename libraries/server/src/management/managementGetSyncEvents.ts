import {
  EventType,
  notOk,
  type ErrorType,
  type PromiseResult,
  type SyncEvent,
} from '@dossierhq/core';
import type { DatabaseAdapter, TransactionContext } from '@dossierhq/database-adapter';
import { SYNC_EVENTS_LIMIT_MAX } from '../config/Limits.js';

export interface SyncEventQuery {
  after: string | null;
  limit: number;
}

export interface SyncEventsPayload {
  events: SyncEvent[];
  hasMore: boolean;
}

export async function managementGetSyncEvents(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  query: SyncEventQuery,
): PromiseResult<SyncEventsPayload, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const { after, limit } = query;
  if (after !== null && typeof after !== 'string') {
    return notOk.BadRequest('Must specify "after" in query');
  }
  if (typeof limit !== 'number') {
    return notOk.BadRequest('Must specify "limit" in query');
  }
  if (limit < 1 || limit > SYNC_EVENTS_LIMIT_MAX) {
    return notOk.BadRequest(`"limit" must be between 1 and ${SYNC_EVENTS_LIMIT_MAX}`);
  }

  const result = await databaseAdapter.managementSyncGetEvents(context, query);
  if (result.isError()) return result;

  // Normalize events
  for (const event of result.value.events) {
    if (event.type === EventType.publishEntities || event.type === EventType.unpublishEntities) {
      event.entities.sort((a, b) => a.id.localeCompare(b.id));
    }
  }

  return result;
}
