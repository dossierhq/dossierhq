import type {
  EntityStatus,
  EntityReference,
  ErrorType,
  PromiseResult,
  UnpublishEntitiesSyncEvent,
} from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityUnpublishGetEntityInfoPayload,
  DatabaseAdminEntityUnpublishUpdateEntityPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { buildSqliteSqlQuery, createSqliteSqlQuery } from '@dossierhq/database-adapter';
import {
  ENTITY_DIRTY_FLAG_INDEX_PUBLISHED,
  ENTITY_DIRTY_FLAG_VALIDATE_PUBLISHED,
  type EntitiesTable,
} from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryMany, queryRun } from '../QueryFunctions.js';
import { getTransactionTimestamp } from '../SqliteTransaction.js';
import { resolveEntityStatus } from '../utils/CodecUtils.js';
import { getEntitiesUpdatedSeq } from './getEntitiesUpdatedSeq.js';
import { assertIsDefined } from '../utils/AssertUtils.js';

export async function adminEntityUnpublishGetEntitiesInfo(
  database: Database,
  context: TransactionContext,
  references: EntityReference[],
): PromiseResult<
  DatabaseAdminEntityUnpublishGetEntityInfoPayload[],
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const { addValueList, query, sql } = createSqliteSqlQuery();
  const uuids = addValueList(references.map(({ id }) => id));
  sql`SELECT e.id, e.uuid, e.type, e.published_entity_versions_id, e.auth_key, e.resolved_auth_key, e.status, e.updated_at FROM entities e WHERE e.uuid IN ${uuids}`;

  const result = await queryMany<
    Pick<
      EntitiesTable,
      | 'id'
      | 'uuid'
      | 'type'
      | 'published_entity_versions_id'
      | 'auth_key'
      | 'resolved_auth_key'
      | 'status'
      | 'updated_at'
    >
  >(database, context, query);
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
        entityVersionInternalId: entityInfo.published_entity_versions_id,
        type: entityInfo.type,
        authKey: entityInfo.auth_key,
        resolvedAuthKey: entityInfo.resolved_auth_key,
        status: resolveEntityStatus(entityInfo.status),
        updatedAt: new Date(entityInfo.updated_at),
      };
    }),
  );
}

export async function adminEntityUnpublishEntities(
  database: Database,
  context: TransactionContext,
  status: EntityStatus,
  references: DatabaseResolvedEntityReference[],
  syncEvent: UnpublishEntitiesSyncEvent | null,
): PromiseResult<DatabaseAdminEntityUnpublishUpdateEntityPayload[], typeof ErrorType.Generic> {
  const now = syncEvent?.createdAt ?? getTransactionTimestamp(context.transaction);
  const nowString = now.toISOString();
  const ids = references.map(({ entityInternalId }) => entityInternalId as number);

  for (const reference of references) {
    const updatedSeqResult = await getEntitiesUpdatedSeq(database, context);
    if (updatedSeqResult.isError()) return updatedSeqResult;

    const updateEntityResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql }) => {
        const dirty = ~(ENTITY_DIRTY_FLAG_VALIDATE_PUBLISHED | ENTITY_DIRTY_FLAG_INDEX_PUBLISHED);
        sql`UPDATE entities SET published_entity_versions_id = NULL, published_name = NULL, updated_at = ${nowString}, updated_seq = ${updatedSeqResult.value}, status = ${status}, invalid = invalid & ~2, dirty = dirty & ${dirty}`;
        sql`WHERE id = ${reference.entityInternalId as number}`;
      }),
    );
    if (updateEntityResult.isError()) return updateEntityResult;
  }

  const removeReferencesIndexResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql, addValueList }) => {
      sql`DELETE FROM entity_published_references WHERE from_entities_id IN ${addValueList(ids)}`;
    }),
  );
  if (removeReferencesIndexResult.isError()) return removeReferencesIndexResult;

  const removeLocationsIndexResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql, addValueList }) => {
      sql`DELETE FROM entity_published_locations WHERE entities_id IN ${addValueList(ids)}`;
    }),
  );
  if (removeLocationsIndexResult.isError()) return removeLocationsIndexResult;

  const removeValueTypesIndexResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql, addValueList }) => {
      sql`DELETE FROM entity_published_value_types WHERE entities_id IN ${addValueList(ids)}`;
    }),
  );
  if (removeValueTypesIndexResult.isError()) return removeValueTypesIndexResult;

  const ftsResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql, addValueList }) => {
      sql`DELETE FROM entities_published_fts WHERE rowid IN ${addValueList(ids)} `;
    }),
  );
  if (ftsResult.isError()) return ftsResult;

  return ok(
    references.map((reference) => {
      return { entityInternalId: reference.entityInternalId, updatedAt: now };
    }),
  );
}

export async function adminEntityUnpublishGetPublishedReferencedEntities(
  database: Database,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference,
): PromiseResult<EntityReference[], typeof ErrorType.Generic> {
  const result = await queryMany<Pick<EntitiesTable, 'uuid'>>(database, context, {
    text: `SELECT e.uuid
       FROM entity_published_references epr, entities e
       WHERE epr.to_entities_id = ?1
         AND epr.from_entities_id = e.id`,
    values: [reference.entityInternalId as number],
  });
  if (result.isError()) return result;

  return result.map((row) => row.map(({ uuid }) => ({ id: uuid })));
}
