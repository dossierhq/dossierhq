import type { EntityVersionReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityPublishGetVersionInfoPayload,
  DatabaseAdminEntityPublishUpdateEntityArg,
  DatabaseAdminEntityUpdateStatusPayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNoneOrOne, queryOne } from '../QueryFunctions.js';
import { resolveEntityStatus, resolveEntityValidity } from '../utils/CodecUtils.js';

export async function adminEntityPublishGetVersionInfo(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: EntityVersionReference
): PromiseResult<
  DatabaseAdminEntityPublishGetVersionInfoPayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result = await queryNoneOrOne<
    Pick<EntityVersionsTable, 'id' | 'entities_id' | 'data'> &
      Pick<
        EntitiesTable,
        | 'type'
        | 'auth_key'
        | 'resolved_auth_key'
        | 'status'
        | 'invalid'
        | 'updated_at'
        | 'published_entity_versions_id'
        | 'latest_draft_entity_versions_id'
      >
  >(databaseAdapter, context, {
    text: `SELECT ev.id, ev.entities_id, ev.data, e.type, e.auth_key, e.resolved_auth_key, e.status, e.invalid, e.updated_at, e.published_entity_versions_id, e.latest_draft_entity_versions_id
         FROM entity_versions ev, entities e
         WHERE e.uuid = $1 AND e.id = ev.entities_id AND ev.version = $2`,
    values: [reference.id, reference.version],
  });

  if (result.isError()) return result;
  if (!result.value) {
    return notOk.NotFound('No such entity or version');
  }

  const {
    id: entityVersionInternalId,
    entities_id: entityInternalId,
    data: fieldValues,
    type,
    auth_key: authKey,
    resolved_auth_key: resolvedAuthKey,
    updated_at: updatedAt,
  } = result.value;

  const status = resolveEntityStatus(result.value.status);
  const validity = resolveEntityValidity(result.value.invalid, status);

  return ok({
    entityInternalId,
    entityVersionInternalId,
    versionIsPublished: entityVersionInternalId === result.value.published_entity_versions_id,
    versionIsLatest: entityVersionInternalId === result.value.latest_draft_entity_versions_id,
    authKey,
    resolvedAuthKey,
    type,
    status,
    validPublished: validity.validPublished,
    updatedAt,
    fieldValues,
  });
}

export async function adminEntityPublishUpdateEntity(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  values: DatabaseAdminEntityPublishUpdateEntityArg
): PromiseResult<DatabaseAdminEntityUpdateStatusPayload, typeof ErrorType.Generic> {
  const { entityVersionInternalId, status, entityInternalId } = values;

  const updateResult = await queryOne<Pick<EntitiesTable, 'updated_at'>>(databaseAdapter, context, {
    text: `UPDATE entities
          SET
            never_published = FALSE,
            archived = FALSE,
            published_entity_versions_id = $1,
            updated_at = NOW(),
            updated = nextval('entities_updated_seq'),
            status = $2,
            invalid = invalid & ~2,
            dirty = dirty & (~(2|8))
          WHERE id = $3
          RETURNING updated_at`,
    values: [entityVersionInternalId, status, entityInternalId],
  });
  if (updateResult.isError()) return updateResult;

  const { updated_at: updatedAt } = updateResult.value;
  return ok({ updatedAt });
}
