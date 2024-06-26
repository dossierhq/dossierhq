import {
  ok,
  type ArchiveEntitySyncEvent,
  type EntityStatus,
  type ErrorType,
  type PromiseResult,
  type UnarchiveEntitySyncEvent,
} from '@dossierhq/core';
import type {
  DatabaseAdminEntityUpdateStatusPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { queryRun, type Database } from '../QueryFunctions.js';
import { getTransactionTimestamp } from '../SqliteTransaction.js';
import { getEntitiesUpdatedSeq } from './getEntitiesUpdatedSeq.js';

export async function adminEntityUpdateStatus(
  database: Database,
  context: TransactionContext,
  status: EntityStatus,
  reference: DatabaseResolvedEntityReference,
  syncEvent: ArchiveEntitySyncEvent | UnarchiveEntitySyncEvent | null,
): PromiseResult<DatabaseAdminEntityUpdateStatusPayload, typeof ErrorType.Generic> {
  const now = syncEvent?.createdAt ?? getTransactionTimestamp(context.transaction);
  const updatedReqResult = await getEntitiesUpdatedSeq(database, context);
  if (updatedReqResult.isError()) return updatedReqResult;

  const result = await queryRun(database, context, {
    text: `UPDATE entities SET
        updated_at = ?1,
        updated_seq = ?2,
        status = ?3
      WHERE id = ?4`,
    values: [
      now.toISOString(),
      updatedReqResult.value,
      status,
      reference.entityInternalId as number,
    ],
  });
  if (result.isError()) return result;

  return ok({ updatedAt: now });
}
