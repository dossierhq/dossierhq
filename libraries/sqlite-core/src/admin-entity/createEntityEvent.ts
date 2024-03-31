import type {
  CreatePrincipalSyncEvent,
  ErrorType,
  PromiseResult,
  SyncEvent,
  UpdateSchemaSyncEvent,
} from '@dossierhq/core';
import type {
  DatabaseAdminEntityCreateEntityEventArg,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { Database } from '../QueryFunctions.js';
import { createEntityEvent } from '../utils/EventUtils.js';

export async function adminEntityCreateEntityEvent(
  database: Database,
  context: TransactionContext,
  event: DatabaseAdminEntityCreateEntityEventArg,
  syncEvent: Exclude<Exclude<SyncEvent, UpdateSchemaSyncEvent>, CreatePrincipalSyncEvent> | null,
): PromiseResult<void, typeof ErrorType.Generic> {
  return await createEntityEvent(
    database,
    context,
    event.session,
    event.type,
    event.references.map(({ entityVersionInternalId, publishedName }) => ({
      entityVersionsId: entityVersionInternalId as number,
      publishedName,
    })),
    syncEvent,
  );
}
