import type { AdminEntityStatus, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityUpdateStatusPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { Database } from '../QueryFunctions.js';
import { queryNone } from '../QueryFunctions.js';
import { getEntitiesUpdatedSeq } from './getEntitiesUpdatedSeq.js';

export async function adminEntityUpdateStatus(
  database: Database,
  context: TransactionContext,
  status: AdminEntityStatus,
  reference: DatabaseResolvedEntityReference
): PromiseResult<DatabaseAdminEntityUpdateStatusPayload, typeof ErrorType.Generic> {
  const now = Temporal.Now.instant();
  const updatedReqResult = await getEntitiesUpdatedSeq(database, context);
  if (updatedReqResult.isError()) return updatedReqResult;

  const result = await queryNone(database, context, {
    text: `UPDATE entities SET
        updated_at = ?1,
        updated_seq = ?2,
        status = ?3
      WHERE id = ?4`,
    values: [now.toString(), updatedReqResult.value, status, reference.entityInternalId as number],
  });

  if (result.isError()) {
    return result;
  }

  return ok({ updatedAt: now });
}
