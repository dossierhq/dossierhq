import {
  AdminEntityStatus,
  ok,
  type ArchiveEntitySyncEvent,
  type ErrorType,
  type PromiseResult,
  type UnarchiveEntitySyncEvent,
} from '@dossierhq/core';
import {
  buildPostgresSqlQuery,
  type DatabaseAdminEntityUpdateStatusPayload,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryOne } from '../QueryFunctions.js';

export async function adminEntityUpdateStatus(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  status: AdminEntityStatus,
  reference: DatabaseResolvedEntityReference,
  syncEvent: ArchiveEntitySyncEvent | UnarchiveEntitySyncEvent | null,
): PromiseResult<DatabaseAdminEntityUpdateStatusPayload, typeof ErrorType.Generic> {
  const result = await queryOne<Pick<EntitiesTable, 'updated_at'>>(
    databaseAdapter,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      sql`UPDATE entities SET archived = ${status === AdminEntityStatus.archived}`;
      if (syncEvent) {
        sql`, updated_at = ${syncEvent.createdAt}`;
      } else {
        sql`, updated_at = NOW()`;
      }
      sql`, updated = nextval('entities_updated_seq'), status = ${status}`;
      sql`WHERE id = ${reference.entityInternalId} RETURNING updated_at`;
    }),
  );
  if (result.isError()) return result;

  return ok({ updatedAt: result.value.updated_at });
}
