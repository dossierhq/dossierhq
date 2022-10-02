import type { EntityReference, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityArchivingEntityInfoPayload,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import type { EntitiesTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNoneOrOne } from '../QueryFunctions.js';
import { resolveEntityStatus } from '../utils/CodecUtils.js';

export async function adminEntityArchivingGetEntityInfo(
  database: Database,
  context: TransactionContext,
  reference: EntityReference
): PromiseResult<
  DatabaseAdminEntityArchivingEntityInfoPayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result = await queryNoneOrOne<
    Pick<
      EntitiesTable,
      'id' | 'auth_key' | 'resolved_auth_key' | 'status' | 'updated_at' | 'never_published'
    >
  >(database, context, {
    text: 'SELECT e.id, e.auth_key, e.resolved_auth_key, e.status, e.updated_at, e.never_published FROM entities e WHERE e.uuid = $1',
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
    never_published: neverPublished,
  } = result.value;

  return ok({
    entityInternalId,
    authKey,
    resolvedAuthKey,
    status: resolveEntityStatus(status),
    updatedAt: new Date(updatedAt),
    neverPublished,
  });
}
