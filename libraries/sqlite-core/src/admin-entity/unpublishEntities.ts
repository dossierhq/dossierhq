import type { AdminEntityStatus, EntityReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { assertIsDefined, notOk, ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityUnpublishGetEntityInfoPayload,
  DatabaseAdminEntityUnpublishUpdateEntityPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { buildSqliteSqlQuery, createSqliteSqlQuery } from '@dossierhq/database-adapter';
import type { EntitiesTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryMany, queryRun } from '../QueryFunctions.js';
import { resolveEntityStatus } from '../utils/CodecUtils.js';
import { getEntitiesUpdatedSeq } from './getEntitiesUpdatedSeq.js';

export async function adminEntityUnpublishGetEntitiesInfo(
  database: Database,
  context: TransactionContext,
  references: EntityReference[]
): PromiseResult<
  DatabaseAdminEntityUnpublishGetEntityInfoPayload[],
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const { addValueList, query, sql } = createSqliteSqlQuery();
  const uuids = addValueList(references.map(({ id }) => id));
  sql`SELECT e.id, e.uuid, e.auth_key, e.resolved_auth_key, e.status, e.updated_at FROM entities e WHERE e.uuid IN ${uuids}`;

  const result = await queryMany<
    Pick<EntitiesTable, 'id' | 'uuid' | 'auth_key' | 'resolved_auth_key' | 'status' | 'updated_at'>
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
        authKey: entityInfo.auth_key,
        resolvedAuthKey: entityInfo.resolved_auth_key,
        status: resolveEntityStatus(entityInfo.status),
        updatedAt: new Date(entityInfo.updated_at),
      };
    })
  );
}

export async function adminEntityUnpublishEntities(
  database: Database,
  context: TransactionContext,
  status: AdminEntityStatus,
  references: DatabaseResolvedEntityReference[]
): PromiseResult<DatabaseAdminEntityUnpublishUpdateEntityPayload[], typeof ErrorType.Generic> {
  const updatedSeqResult = await getEntitiesUpdatedSeq(database, context);
  if (updatedSeqResult.isError()) return updatedSeqResult;

  const now = new Date();
  const result = await queryMany<Pick<EntitiesTable, 'id'>>(
    database,
    context,
    buildSqliteSqlQuery(({ sql, addValueList }) => {
      const ids = addValueList(
        references.map(({ entityInternalId }) => entityInternalId as number)
      );
      sql`UPDATE entities SET published_entity_versions_id = NULL, updated_at = ${now.toISOString()}, updated_seq = ${
        updatedSeqResult.value
      }, status = ${status}, invalid = invalid & ~2, dirty = dirty & (~(2|8)) WHERE id IN ${ids} RETURNING id`;
    })
  );
  if (result.isError()) return result;

  const removeReferencesIndexResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql, addValueList }) => {
      sql`DELETE FROM entity_published_references WHERE from_entities_id IN ${addValueList(
        references.map(({ entityInternalId }) => entityInternalId as number)
      )}`;
    })
  );
  if (removeReferencesIndexResult.isError()) return removeReferencesIndexResult;

  const removeLocationsIndexResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql, addValueList }) => {
      sql`DELETE FROM entity_published_locations WHERE entities_id IN ${addValueList(
        references.map(({ entityInternalId }) => entityInternalId as number)
      )}`;
    })
  );
  if (removeLocationsIndexResult.isError()) return removeLocationsIndexResult;

  const removeValueTypesIndexResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql, addValueList }) => {
      sql`DELETE FROM entity_published_value_types WHERE entities_id IN ${addValueList(
        references.map(({ entityInternalId }) => entityInternalId as number)
      )}`;
    })
  );
  if (removeValueTypesIndexResult.isError()) return removeValueTypesIndexResult;

  const ftsResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql, addValueList }) => {
      sql`DELETE FROM entities_published_fts WHERE rowid IN ${addValueList(
        references.map(({ entityInternalId }) => entityInternalId as number)
      )} `;
    })
  );
  if (ftsResult.isError()) return ftsResult;

  return ok(
    references.map((reference) => {
      const row = result.value.find((it) => it.id === reference.entityInternalId);
      assertIsDefined(row);
      return { entityInternalId: row.id, updatedAt: now };
    })
  );
}

export async function adminEntityUnpublishGetPublishedReferencedEntities(
  database: Database,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference
): PromiseResult<EntityReference[], typeof ErrorType.Generic> {
  const result = await queryMany<Pick<EntitiesTable, 'uuid'>>(database, context, {
    text: `SELECT e.uuid
       FROM entity_published_references epr, entities e
       WHERE epr.to_entities_id = ?1
         AND epr.from_entities_id = e.id`,
    values: [reference.entityInternalId as number],
  });
  if (result.isError()) {
    return result;
  }

  return result.map((row) => row.map(({ uuid }) => ({ id: uuid })));
}
