import type { AdminEntityStatus, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityUpdateStatusPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { SqliteDatabaseAdapter } from '..';
import { queryNone } from '../QueryFunctions';

export async function adminEntityUpdateStatus(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  status: AdminEntityStatus,
  reference: DatabaseResolvedEntityReference
): PromiseResult<DatabaseAdminEntityUpdateStatusPayload, ErrorType.Generic> {
  const now = Temporal.Now.instant();
  const result = await queryNone(databaseAdapter, context, {
    text: `UPDATE entities SET
        updated_at = ?1,
        status = ?2
      WHERE id = ?3`,
    values: [now.toString(), status, reference.entityInternalId as number],
  });

  if (result.isError()) {
    return result;
  }

  return ok({ updatedAt: now });
}
