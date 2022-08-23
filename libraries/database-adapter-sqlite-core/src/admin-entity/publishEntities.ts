import type { EntityVersionReference, PromiseResult } from '@jonasb/datadata-core';
import { ErrorType, notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityPublishGetVersionInfoPayload,
  DatabaseAdminEntityPublishUpdateEntityArg,
  DatabaseAdminEntityUpdateStatusPayload,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { buildSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNone, queryNoneOrOne } from '../QueryFunctions.js';
import { resolveEntityStatus } from '../utils/CodecUtils.js';
import { getEntitiesUpdatedSeq } from './getEntitiesUpdatedSeq.js';

export async function adminEntityPublishGetVersionInfo(
  database: Database,
  context: TransactionContext,
  reference: EntityVersionReference
): PromiseResult<
  DatabaseAdminEntityPublishGetVersionInfoPayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result = await queryNoneOrOne<
    Pick<EntityVersionsTable, 'id' | 'entities_id' | 'fields'> &
      Pick<
        EntitiesTable,
        | 'type'
        | 'auth_key'
        | 'resolved_auth_key'
        | 'status'
        | 'updated_at'
        | 'published_entity_versions_id'
        | 'latest_entity_versions_id'
      >
  >(database, context, {
    text: `SELECT ev.id, ev.entities_id, ev.fields, e.type, e.auth_key, e.resolved_auth_key, e.status, e.updated_at, e.published_entity_versions_id, e.latest_entity_versions_id
         FROM entity_versions ev, entities e
         WHERE e.uuid = ?1 AND e.id = ev.entities_id AND ev.version = ?2`,
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
    fields: fieldValues,
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
    versionIsLatest: entityVersionInternalId === result.value.latest_entity_versions_id,
    authKey,
    resolvedAuthKey,
    type,
    status: resolveEntityStatus(status),
    updatedAt: Temporal.Instant.from(updatedAt),
    fieldValues: JSON.parse(fieldValues),
  });
}

export async function adminEntityPublishUpdateEntity(
  database: Database,
  context: TransactionContext,
  values: DatabaseAdminEntityPublishUpdateEntityArg
): PromiseResult<DatabaseAdminEntityUpdateStatusPayload, typeof ErrorType.Generic> {
  const { entityVersionInternalId, status, entityInternalId } = values;

  const updatedSeqResult = await getEntitiesUpdatedSeq(database, context);
  if (updatedSeqResult.isError()) return updatedSeqResult;

  const now = Temporal.Now.instant();

  const updateResult = await queryNone(database, context, {
    text: `UPDATE entities
           SET
             never_published = TRUE,
             published_entity_versions_id = ?1,
             updated_at = ?2,
             updated_seq = ?3,
             status = ?4
           WHERE id = ?5`,
    values: [
      entityVersionInternalId as number,
      now.toString(),
      updatedSeqResult.value,
      status,
      entityInternalId as number,
    ],
  });
  if (updateResult.isError()) {
    return updateResult;
  }

  // FTS virtual tables don't support upsert
  // FTS upsert 1/2) Try to insert
  const ftsInsertResult = await queryNone(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql }) =>
        sql`INSERT INTO entities_published_fts (docid, content)
          VALUES (${entityInternalId as number}, ${values.fullTextSearchText})`
    ),
    (error) => {
      if (database.adapter.isFtsVirtualTableConstraintFailed(error)) {
        return notOk.Conflict('Document already exists');
      }
      return notOk.GenericUnexpectedException(context, error);
    }
  );

  // FTS upsert 2/2) Update when insert failed
  if (ftsInsertResult.isError()) {
    if (ftsInsertResult.isErrorType(ErrorType.Generic)) return ftsInsertResult;

    const ftsUpdateResult = await queryNone(
      database,
      context,
      buildSqliteSqlQuery(
        ({ sql }) =>
          sql`UPDATE entities_published_fts
            SET content = ${values.fullTextSearchText}
            WHERE docid = ${entityInternalId as number}`
      )
    );
    if (ftsUpdateResult.isError()) return ftsUpdateResult;
  }

  return ok({ updatedAt: now });
}

export async function adminEntityPublishUpdatePublishedReferencesIndex(
  database: Database,
  context: TransactionContext,
  fromReference: DatabaseResolvedEntityReference,
  toReferences: DatabaseResolvedEntityReference[]
): PromiseResult<void, typeof ErrorType.Generic> {
  // Step 1: Clear existing references
  const clearResult = await queryNone(database, context, {
    text: 'DELETE FROM entity_published_references WHERE from_entities_id = ?1',
    values: [fromReference.entityInternalId as number],
  });
  if (clearResult.isError()) return clearResult;

  if (toReferences.length === 0) {
    return ok(undefined);
  }

  // Step 2: Insert new references
  const insertResult = await queryNone(
    database,
    context,
    buildSqliteSqlQuery(({ sql, addValue }) => {
      sql`INSERT INTO entity_published_references (from_entities_id, to_entities_id) VALUES`;
      const fromValue = addValue(fromReference.entityInternalId as number);
      for (const toReference of toReferences) {
        sql`(${fromValue}, ${toReference.entityInternalId as number})`;
      }
    })
  );
  return insertResult;
}
