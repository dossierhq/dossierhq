import type { AdminEntityStatus, EntityReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { assertIsDefined, notOk, ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityUnpublishGetEntityInfoPayload,
  DatabaseAdminEntityUnpublishUpdateEntityPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { buildPostgresSqlQuery } from '@dossierhq/database-adapter';
import {
  ENTITY_DIRTY_FLAG_INDEX_PUBLISHED,
  ENTITY_DIRTY_FLAG_VALIDATE_PUBLISHED,
  type EntitiesTable,
} from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryMany, queryNone } from '../QueryFunctions.js';
import { resolveEntityStatus } from '../utils/CodecUtils.js';

export async function adminEntityUnpublishGetEntitiesInfo(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  references: EntityReference[],
): PromiseResult<
  DatabaseAdminEntityUnpublishGetEntityInfoPayload[],
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result = await queryMany<
    Pick<
      EntitiesTable,
      | 'id'
      | 'uuid'
      | 'type'
      | 'latest_draft_entity_versions_id'
      | 'auth_key'
      | 'resolved_auth_key'
      | 'status'
      | 'updated_at'
    >
  >(databaseAdapter, context, {
    text: 'SELECT e.id, e.uuid, e.type, e.latest_draft_entity_versions_id, e.auth_key, e.resolved_auth_key, e.status, e.updated_at FROM entities e WHERE e.uuid = ANY($1)',
    values: [references.map((it) => it.id)],
  });
  if (result.isError()) return result;
  const entitiesInfo = result.value;

  const missingEntityIds = references
    .filter((reference) => !entitiesInfo.find((it) => it.uuid === reference.id))
    .map((it) => it.id);
  if (missingEntityIds.length > 0) {
    return notOk.NotFound(`No such entities: ${missingEntityIds.join(', ')}`);
  }
  return ok(
    references.map((reference) => {
      const entityInfo = entitiesInfo.find((it) => it.uuid === reference.id);
      assertIsDefined(entityInfo);

      return {
        id: entityInfo.uuid,
        entityInternalId: entityInfo.id,
        type: entityInfo.type,
        entityVersionInternalId: entityInfo.latest_draft_entity_versions_id,
        authKey: entityInfo.auth_key,
        resolvedAuthKey: entityInfo.resolved_auth_key,
        status: resolveEntityStatus(entityInfo.status),
        updatedAt: entityInfo.updated_at,
      };
    }),
  );
}

export async function adminEntityUnpublishEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  status: AdminEntityStatus,
  references: DatabaseResolvedEntityReference[],
): PromiseResult<DatabaseAdminEntityUnpublishUpdateEntityPayload[], typeof ErrorType.Generic> {
  const ids = references.map((it) => it.entityInternalId);

  const result = await queryMany<Pick<EntitiesTable, 'id' | 'updated_at'>>(
    databaseAdapter,
    context,
    {
      text: `UPDATE entities
      SET
        published_entity_versions_id = NULL,
        published_fts = NULL,
        published_name = NULL,
        updated_at = NOW(),
        updated = nextval('entities_updated_seq'),
        status = $1,
        invalid = invalid & ~2,
        dirty = dirty & $2
      WHERE id = ANY($3)
      RETURNING id, updated_at`,
      values: [
        status,
        ~(ENTITY_DIRTY_FLAG_VALIDATE_PUBLISHED | ENTITY_DIRTY_FLAG_INDEX_PUBLISHED),
        ids,
      ],
    },
  );
  if (result.isError()) return result;

  const removeReferencesIndexResult = await queryNone(
    databaseAdapter,
    context,
    buildPostgresSqlQuery(({ sql, addValue }) => {
      sql`DELETE FROM entity_published_references WHERE from_entities_id = ANY(${addValue(ids)})`;
    }),
  );
  if (removeReferencesIndexResult.isError()) return removeReferencesIndexResult;

  const removeLocationIndexResult = await queryNone(
    databaseAdapter,
    context,
    buildPostgresSqlQuery(({ sql, addValue }) => {
      sql`DELETE FROM entity_published_locations WHERE entities_id = ANY(${addValue(ids)})`;
    }),
  );
  if (removeLocationIndexResult.isError()) return removeLocationIndexResult;

  const removeValueTypesIndexResult = await queryNone(
    databaseAdapter,
    context,
    buildPostgresSqlQuery(({ sql, addValue }) => {
      sql`DELETE FROM entity_published_value_types WHERE entities_id = ANY(${addValue(ids)})`;
    }),
  );
  if (removeValueTypesIndexResult.isError()) return removeValueTypesIndexResult;

  return ok(
    references.map((reference) => {
      const row = result.value.find((it) => it.id === reference.entityInternalId);
      assertIsDefined(row);
      return { entityInternalId: row.id, updatedAt: row.updated_at };
    }),
  );
}

export async function adminEntityUnpublishGetPublishedReferencedEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference,
): PromiseResult<EntityReference[], typeof ErrorType.Generic> {
  const result = await queryMany<Pick<EntitiesTable, 'uuid'>>(databaseAdapter, context, {
    text: `SELECT e.uuid
       FROM entity_published_references epr, entities e
       WHERE epr.to_entities_id = $1
         AND epr.from_entities_id = e.id`,
    values: [reference.entityInternalId],
  });
  if (result.isError()) return result;

  return result.map((row) => row.map(({ uuid }) => ({ id: uuid })));
}
