import type {
  EntityReference,
  EntityVersionReference,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityPublishGetVersionInfoPayload,
  DatabaseAdminEntityPublishUpdateEntityArg,
  DatabaseAdminEntityUpdateStatusPayload,
  DatabaseResolvedEntityVersionReference,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import { queryMany, queryNoneOrOne, queryOne } from '../QueryFunctions.js';
import { resolveEntityStatus } from '../utils/CodecUtils.js';

export async function adminEntityPublishGetVersionInfo(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: EntityVersionReference
): PromiseResult<
  DatabaseAdminEntityPublishGetVersionInfoPayload,
  ErrorType.NotFound | ErrorType.Generic
> {
  const result = await queryNoneOrOne<
    Pick<EntityVersionsTable, 'id' | 'entities_id' | 'data'> &
      Pick<
        EntitiesTable,
        | 'type'
        | 'auth_key'
        | 'resolved_auth_key'
        | 'status'
        | 'updated_at'
        | 'published_entity_versions_id'
        | 'latest_draft_entity_versions_id'
      >
  >(databaseAdapter, context, {
    text: `SELECT ev.id, ev.entities_id, ev.data, e.type, e.auth_key, e.resolved_auth_key, e.status, e.updated_at, e.published_entity_versions_id, e.latest_draft_entity_versions_id
         FROM entity_versions ev, entities e
         WHERE e.uuid = $1 AND e.id = ev.entities_id AND ev.version = $2`,
    values: [reference.id, reference.version],
  });

  if (result.isError()) {
    return result;
  }
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
    status,
    updated_at: updatedAt,
  } = result.value;

  return ok({
    entityInternalId,
    entityVersionInternalId,
    versionIsPublished: entityVersionInternalId === result.value.published_entity_versions_id,
    versionIsLatest: entityVersionInternalId === result.value.latest_draft_entity_versions_id,
    authKey,
    resolvedAuthKey,
    type,
    status: resolveEntityStatus(status),
    updatedAt,
    fieldValues,
  });
}

export async function adminEntityPublishUpdateEntity(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  values: DatabaseAdminEntityPublishUpdateEntityArg
): PromiseResult<DatabaseAdminEntityUpdateStatusPayload, ErrorType.Generic> {
  const { entityVersionInternalId, fullTextSearchText, status, entityInternalId } = values;

  const updateResult = await queryOne<Pick<EntitiesTable, 'updated_at'>>(databaseAdapter, context, {
    text: `UPDATE entities
          SET
            never_published = FALSE,
            archived = FALSE,
            published_entity_versions_id = $1,
            published_fts = to_tsvector($2),
            updated_at = NOW(),
            updated = nextval('entities_updated_seq'),
            status = $3
          WHERE id = $4
          RETURNING updated_at`,
    values: [entityVersionInternalId, fullTextSearchText, status, entityInternalId],
  });
  if (updateResult.isError()) {
    return updateResult;
  }
  const { updated_at: updatedAt } = updateResult.value;
  return ok({ updatedAt });
}

export async function adminEntityPublishGetUnpublishedReferencedEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: DatabaseResolvedEntityVersionReference
): PromiseResult<EntityReference[], ErrorType.Generic> {
  const result = await queryMany<Pick<EntitiesTable, 'uuid'>>(databaseAdapter, context, {
    text: `SELECT e.uuid
           FROM entity_version_references evr, entities e
           WHERE evr.entity_versions_id = $1
             AND evr.entities_id = e.id
             AND e.published_entity_versions_id IS NULL`,
    values: [reference.entityVersionInternalId],
  });
  if (result.isError()) {
    return result;
  }
  return result.map((rows) => rows.map(({ uuid }) => ({ id: uuid })));
}
