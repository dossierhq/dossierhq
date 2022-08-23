import type { EntityReference, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabaseEntityUpdateEntityArg,
  DatabaseEntityUpdateEntityPayload,
  DatabaseEntityUpdateGetEntityInfoPayload,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { buildSqliteSqlQuery, SqliteQueryBuilder } from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import { EntitiesUniqueNameConstraint } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNone, queryNoneOrOne, queryOne } from '../QueryFunctions.js';
import { resolveEntityStatus } from '../utils/CodecUtils.js';
import { getSessionSubjectInternalId } from '../utils/SessionUtils.js';
import { withUniqueNameAttempt } from '../utils/withUniqueNameAttempt.js';
import { getEntitiesUpdatedSeq } from './getEntitiesUpdatedSeq.js';
import { updateEntityLatestReferencesIndex } from './updateEntityLatestReferencesIndex.js';

export async function adminEntityUpdateGetEntityInfo(
  database: Database,
  context: TransactionContext,
  reference: EntityReference
): PromiseResult<
  DatabaseEntityUpdateGetEntityInfoPayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result = await queryNoneOrOne<
    Pick<
      EntitiesTable,
      | 'id'
      | 'type'
      | 'name'
      | 'auth_key'
      | 'resolved_auth_key'
      | 'created_at'
      | 'updated_at'
      | 'status'
    > &
      Pick<EntityVersionsTable, 'version' | 'fields'>
  >(database, context, {
    text: `SELECT e.id, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev
        WHERE e.uuid = ?1 AND e.latest_entity_versions_id = ev.id`,
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
    type,
    name,
    auth_key: authKey,
    resolved_auth_key: resolvedAuthKey,
    status,
    version,
    created_at: createdAt,
    updated_at: updatedAt,
    fields: fieldValues,
  } = result.value;

  return ok({
    entityInternalId,
    type,
    name,
    authKey,
    resolvedAuthKey,
    status: resolveEntityStatus(status),
    version,
    createdAt: Temporal.Instant.from(createdAt),
    updatedAt: Temporal.Instant.from(updatedAt),
    fieldValues: JSON.parse(fieldValues),
  });
}

export async function adminEntityUpdateEntity(
  database: Database,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseEntityUpdateEntityArg
): PromiseResult<DatabaseEntityUpdateEntityPayload, typeof ErrorType.Generic> {
  const now = Temporal.Now.instant();

  const createVersionResult = await queryOne<Pick<EntityVersionsTable, 'id'>>(database, context, {
    text: 'INSERT INTO entity_versions (entities_id, created_at, created_by, version, fields) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id',
    values: [
      entity.entityInternalId as number,
      now.toString(),
      getSessionSubjectInternalId(entity.session),
      entity.version,
      JSON.stringify(entity.fieldValues),
    ],
  });
  if (createVersionResult.isError()) {
    return createVersionResult;
  }
  const { id: versionsId } = createVersionResult.value;

  let newName = entity.name;
  if (entity.changeName) {
    const nameResult = await withUniqueNameAttempt(
      context,
      entity.name,
      randomNameGenerator,
      async (context, name, nameConflictErrorMessage) => {
        const updateNameResult = await queryNone(
          database,
          context,
          {
            text: 'UPDATE entities SET name = ?1 WHERE id = ?2',
            values: [name, entity.entityInternalId as number],
          },
          (error) => {
            if (
              database.adapter.isUniqueViolationOfConstraint(error, EntitiesUniqueNameConstraint)
            ) {
              return notOk.Conflict(nameConflictErrorMessage);
            }
            return notOk.GenericUnexpectedException(context, error);
          }
        );
        if (updateNameResult.isError()) {
          return updateNameResult;
        }

        return ok(name);
      }
    );

    if (nameResult.isError()) {
      return nameResult;
    }
    newName = nameResult.value;
  }

  const updatedReqResult = await getEntitiesUpdatedSeq(database, context);
  if (updatedReqResult.isError()) return updatedReqResult;

  const updateEntityResult = await queryNone(database, context, {
    text: `UPDATE entities SET
             latest_entity_versions_id = ?1,
             updated_at = ?2,
             updated_seq = ?3,
             status = ?4
           WHERE id = ?5`,
    values: [
      versionsId,
      now.toString(),
      updatedReqResult.value,
      entity.status,
      entity.entityInternalId as number,
    ],
  });
  if (updateEntityResult.isError()) {
    return updateEntityResult;
  }

  const ftsResult = await queryNone(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql }) =>
        sql`UPDATE entities_latest_fts SET content = ${entity.fullTextSearchText} WHERE docid = ${
          entity.entityInternalId as number
        }`
    )
  );
  if (ftsResult.isError()) return ftsResult;

  // Update latest references
  const updateReferencesIndexResult = await updateEntityLatestReferencesIndex(
    database,
    context,
    entity,
    entity.referenceIds,
    { skipDelete: false }
  );
  if (updateReferencesIndexResult.isError()) return updateReferencesIndexResult;

  if (entity.locations.length > 0) {
    const qb = new SqliteQueryBuilder(
      'INSERT INTO entity_version_locations (entity_versions_id, lat, lng) VALUES',
      [versionsId]
    );
    for (const location of entity.locations) {
      qb.addQuery(`(?1, ${qb.addValue(location.lat)}, ${qb.addValue(location.lng)})`);
    }
    const locationsResult = await queryNone(database, context, qb.build());
    if (locationsResult.isError()) {
      return locationsResult;
    }
  }
  return ok({ name: newName, updatedAt: now });
}
