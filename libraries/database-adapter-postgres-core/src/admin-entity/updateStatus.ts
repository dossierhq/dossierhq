import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { AdminEntityStatus, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityUpdateStatusPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-server';
import type { PostgresDatabaseAdapter } from '..';
import type { EntitiesTable } from '../DatabaseSchema';
import { queryOne } from '../QueryFunctions';

export async function adminEntityUpdateStatus(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  status: AdminEntityStatus,
  reference: DatabaseResolvedEntityReference
): PromiseResult<DatabaseAdminEntityUpdateStatusPayload, ErrorType.Generic> {
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

  if (result.isError()) {
    return result;
  }

  return ok({ updatedAt: result.value.updated_at });
}
