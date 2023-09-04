import type {
  ArchiveEntitySyncEvent,
  ErrorType,
  PromiseResult,
  UnarchiveEntitySyncEvent,
} from '@dossierhq/core';
import { AdminEntityStatus, ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityUpdateStatusPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryOne } from '../QueryFunctions.js';

export async function adminEntityUpdateStatus(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  status: AdminEntityStatus,
  reference: DatabaseResolvedEntityReference,
  _syncEvent: ArchiveEntitySyncEvent | UnarchiveEntitySyncEvent | null,
): PromiseResult<DatabaseAdminEntityUpdateStatusPayload, typeof ErrorType.Generic> {
  const result = await queryOne<Pick<EntitiesTable, 'updated_at'>>(databaseAdapter, context, {
    text: `UPDATE entities SET
        archived = $1,
        updated_at = NOW(),
        updated = nextval('entities_updated_seq'),
        status = $2
      WHERE id = $3
      RETURNING updated_at`,
    values: [status === AdminEntityStatus.archived, status, reference.entityInternalId],
  });
  if (result.isError()) return result;

  return ok({ updatedAt: result.value.updated_at });
}
