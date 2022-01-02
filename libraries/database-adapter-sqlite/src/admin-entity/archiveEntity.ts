import type {
  AdminEntityStatus,
  EntityReference,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityArchiveEntityInfoPayload,
  DatabaseAdminEntityArchiveEntityPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-server';
import { Temporal } from '@js-temporal/polyfill';
import type { SqliteDatabaseAdapter } from '..';
import type { EntitiesTable } from '../DatabaseSchema';
import { queryNone, queryNoneOrOne } from '../QueryFunctions';
import { resolveEntityStatus } from '../utils/CodecUtils';

export async function adminEntityArchiveGetEntityInfo(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference
): PromiseResult<
  DatabaseAdminEntityArchiveEntityInfoPayload,
  ErrorType.NotFound | ErrorType.Generic
> {
  const result = await queryNoneOrOne<
    Pick<EntitiesTable, 'id' | 'auth_key' | 'resolved_auth_key' | 'status' | 'updated_at'>
  >(databaseAdapter, context, {
    text: 'SELECT e.id, e.auth_key, e.resolved_auth_key, e.status, e.updated_at FROM entities e WHERE e.uuid = $1',
    values: [reference.id],
  });

  if (result.isError()) {
    return result;
  }
  if (!result.value) {
    return notOk.NotFound('No such entity');
  }

  const {
    id: entityInternalId,
    auth_key: authKey,
    resolved_auth_key: resolvedAuthKey,
    status,
    updated_at: updatedAt,
  } = result.value;

  return ok({
    entityInternalId,
    authKey,
    resolvedAuthKey,
    status: resolveEntityStatus(status),
    updatedAt: Temporal.Instant.from(updatedAt),
  });
}

export async function adminEntityArchiveEntity(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  status: AdminEntityStatus,
  reference: DatabaseResolvedEntityReference
): PromiseResult<DatabaseAdminEntityArchiveEntityPayload, ErrorType.Generic> {
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
