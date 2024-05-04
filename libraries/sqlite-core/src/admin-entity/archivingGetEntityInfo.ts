import {
  notOk,
  ok,
  type EntityReference,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type {
  DatabaseAdminEntityArchivingEntityInfoPayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable } from '../DatabaseSchema.js';
import { queryNoneOrOne, type Database } from '../QueryFunctions.js';
import { resolveEntityStatus } from '../utils/CodecUtils.js';

export async function adminEntityArchivingGetEntityInfo(
  database: Database,
  context: TransactionContext,
  reference: EntityReference,
): PromiseResult<
  DatabaseAdminEntityArchivingEntityInfoPayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result = await queryNoneOrOne<
    Pick<
      EntitiesTable,
      | 'id'
      | 'type'
      | 'auth_key'
      | 'resolved_auth_key'
      | 'status'
      | 'updated_at'
      | 'never_published'
      | 'latest_entity_versions_id'
    >
  >(database, context, {
    text: 'SELECT e.id, e.type, e.auth_key, e.resolved_auth_key, e.status, e.updated_at, e.never_published, e.latest_entity_versions_id FROM entities e WHERE e.uuid = ?1',
    values: [reference.id],
  });
  if (result.isError()) return result;

  if (!result.value) {
    return notOk.NotFound('No such entity');
  }

  const {
    id: entityInternalId,
    latest_entity_versions_id: versionId,
    type,
    auth_key: authKey,
    resolved_auth_key: resolvedAuthKey,
    status,
    updated_at: updatedAt,
    never_published: neverPublished,
  } = result.value;

  return ok({
    entityInternalId,
    entityVersionInternalId: versionId,
    type,
    authKey,
    resolvedAuthKey,
    status: resolveEntityStatus(status),
    updatedAt: new Date(updatedAt),
    neverPublished: !!neverPublished,
  });
}
