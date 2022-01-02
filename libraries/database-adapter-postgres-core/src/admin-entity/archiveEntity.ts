import type { EntityReference, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityArchiveEntityInfoPayload,
  DatabaseAdminEntityArchiveEntityPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-server';
import type { PostgresDatabaseAdapter } from '..';
import type { EntitiesTable } from '../DatabaseSchema';
import { queryNoneOrOne, queryOne } from '../QueryFunctions';
import { resolveEntityStatus } from '../utils/CodecUtils';

export async function adminEntityArchiveGetEntityInfo(
  databaseAdapter: PostgresDatabaseAdapter,
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
    updatedAt,
  });
}

export async function adminEntityArchiveEntity(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference
): PromiseResult<DatabaseAdminEntityArchiveEntityPayload, ErrorType.Generic> {
  const result = await queryOne<Pick<EntitiesTable, 'updated_at'>>(databaseAdapter, context, {
    text: `UPDATE entities SET
        archived = TRUE,
        updated_at = NOW(),
        updated = nextval('entities_updated_seq'),
        status = 'archived'
      WHERE id = $1
      RETURNING updated_at`,
    values: [reference.entityInternalId],
  });

  if (result.isError()) {
    return result;
  }

  return ok({ updatedAt: result.value.updated_at });
}
