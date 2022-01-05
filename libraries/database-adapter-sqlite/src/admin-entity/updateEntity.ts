import type { EntityReference, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabaseEntityUpdateEntityArg,
  DatabaseEntityUpdateEntityPayload,
  DatabaseEntityUpdateGetEntityInfoPayload,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { SqliteQueryBuilder } from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { SqliteDatabaseAdapter } from '..';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema';
import { EntitiesUniqueNameConstraint } from '../DatabaseSchema';
import { queryNone, queryNoneOrOne, queryOne } from '../QueryFunctions';
import { resolveEntityStatus } from '../utils/CodecUtils';
import { getSessionSubjectInternalId } from '../utils/SessionUtils';
import { withUniqueNameAttempt } from '../utils/withUniqueNameAttempt';

export async function adminEntityUpdateGetEntityInfo(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference
): PromiseResult<DatabaseEntityUpdateGetEntityInfoPayload, ErrorType.NotFound | ErrorType.Generic> {
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
  >(databaseAdapter, context, {
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
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseEntityUpdateEntityArg
): PromiseResult<DatabaseEntityUpdateEntityPayload, ErrorType.Generic> {
  const now = Temporal.Now.instant();

  const createVersionResult = await queryOne<Pick<EntityVersionsTable, 'id'>>(
    databaseAdapter,
    context,
    {
      text: 'INSERT INTO entity_versions (entities_id, created_at, created_by, version, fields) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id',
      values: [
        entity.entityInternalId as number,
        now.toString(),
        getSessionSubjectInternalId(entity.session),
        entity.version,
        JSON.stringify(entity.fieldValues),
      ],
    }
  );
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
          databaseAdapter,
          context,
          {
            text: 'UPDATE entities SET name = ?1 WHERE id = ?2',
            values: [name, entity.entityInternalId as number],
          },
          (error) => {
            if (
              databaseAdapter.isUniqueViolationOfConstraint(error, EntitiesUniqueNameConstraint)
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

  //TODO update latest_fts
  const updateEntityResult = await queryNone(databaseAdapter, context, {
    text: `UPDATE entities SET
             latest_entity_versions_id = ?1,
             updated_at = ?2,
             status = ?3
           WHERE id = ?4`,
    values: [versionsId, now.toString(), entity.status, entity.entityInternalId as number],
  });
  if (updateEntityResult.isError()) {
    return updateEntityResult;
  }

  if (entity.referenceIds.length > 0) {
    const qb = new SqliteQueryBuilder(
      'INSERT INTO entity_version_references (entity_versions_id, entities_id) VALUES',
      [versionsId]
    );
    for (const referenceId of entity.referenceIds) {
      qb.addQuery(`(?1, ${qb.addValue(referenceId.entityInternalId as number)})`);
    }
    const referenceResult = await queryNone(databaseAdapter, context, qb.build());
    if (referenceResult.isError()) {
      return referenceResult;
    }
  }

  if (entity.locations.length > 0) {
    const qb = new SqliteQueryBuilder(
      'INSERT INTO entity_version_locations (entity_versions_id, location) VALUES',
      [versionsId]
    );
    for (const location of entity.locations) {
      qb.addQuery(
        `(?1, ST_SetSRID(ST_Point(${qb.addValue(location.lng)}, ${qb.addValue(
          location.lat
        )}), 4326))`
      );
    }
    const locationsResult = await queryNone(databaseAdapter, context, qb.build());
    if (locationsResult.isError()) {
      return locationsResult;
    }
  }
  return ok({ name: newName, updatedAt: now });
}
