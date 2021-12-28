import { notOk, ok, type ErrorType, type PromiseResult } from '@jonasb/datadata-core';
import {
  QueryBuilder,
  type DatabaseAdminEntityCreateEntityArg,
  type DatabaseAdminEntityCreatePayload,
  type TransactionContext,
} from '@jonasb/datadata-server';
import { Temporal } from '@js-temporal/polyfill';
import { v4 as uuidv4 } from 'uuid';
import type { SqliteDatabaseAdapter } from '..';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema';
import { EntitiesUniqueNameConstraint, EntitiesUniqueUuidConstraint } from '../DatabaseSchema';
import { queryNone, queryOne } from '../QueryFunctions';
import { withUniqueNameAttempt } from '../utils/withUniqueNameAttempt';

export async function adminEntityCreate(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseAdminEntityCreateEntityArg
): PromiseResult<DatabaseAdminEntityCreatePayload, ErrorType.Conflict | ErrorType.Generic> {
  const createEntityRowResult = await createEntityRow(
    databaseAdapter,
    context,
    randomNameGenerator,
    entity
  );
  if (createEntityRowResult.isError()) {
    return createEntityRowResult;
  }

  const { uuid, actualName, entityId, createdAt, updatedAt } = createEntityRowResult.value;

  const createEntityVersionResult = await queryOne<Pick<EntityVersionsTable, 'id'>>(
    databaseAdapter,
    context,
    {
      text: 'INSERT INTO entity_versions (entities_id, version, created_by, fields) VALUES ($1, 0, $2, $3) RETURNING id',
      values: [entityId, entity.creator.subjectInternalId, JSON.stringify(entity.fieldsData)],
    }
  );
  if (createEntityVersionResult.isError()) {
    return createEntityVersionResult;
  }
  const { id: versionsId } = createEntityVersionResult.value;

  const updateLatestDraftIdResult = await queryNone(databaseAdapter, context, {
    text: 'UPDATE entities SET latest_entity_versions_id = $1 WHERE id = $2',
    values: [versionsId, entityId],
  });
  if (updateLatestDraftIdResult.isError()) {
    return updateLatestDraftIdResult;
  }

  if (entity.referenceIds.length > 0) {
    const qb = new QueryBuilder(
      'INSERT INTO entity_version_references (entity_versions_id, entities_id) VALUES',
      [versionsId]
    );
    for (const referenceId of entity.referenceIds) {
      qb.addQuery(`($1, ${qb.addValue(referenceId)})`);
    }
    //TODO check result
    await queryNone(databaseAdapter, context, qb.build());
  }
  if (entity.locations.length > 0) {
    const qb = new QueryBuilder(
      'INSERT INTO entity_version_locations (entity_versions_id, location) VALUES',
      [versionsId]
    );
    for (const location of entity.locations) {
      qb.addQuery(
        `($1, ST_SetSRID(ST_Point(${qb.addValue(location.lng)}, ${qb.addValue(
          location.lat
        )}), 4326))`
      );
    }
    //TODO check result
    await queryNone(databaseAdapter, context, qb.build());
  }

  return ok({ id: uuid, name: actualName, createdAt, updatedAt });
}

async function createEntityRow(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseAdminEntityCreateEntityArg
) {
  const uuid = entity.id ?? uuidv4();
  const now = Temporal.Now.instant();

  return await withUniqueNameAttempt(
    databaseAdapter,
    context,
    entity.name,
    randomNameGenerator,
    async (context, name, nameConflictErrorMessage) => {
      //TODO set latest_fts
      const createResult = await queryOne<Pick<EntitiesTable, 'id'>, ErrorType.Conflict>(
        databaseAdapter,
        context,
        {
          text: `INSERT INTO entities (uuid, name, type, auth_key, resolved_auth_key, status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING id`,
          values: [
            uuid,
            name,
            entity.type,
            entity.resolvedAuthKey.authKey,
            entity.resolvedAuthKey.resolvedAuthKey,
            'draft',
            now.toString(),
          ],
        },
        (error) => {
          if (databaseAdapter.isUniqueViolationOfConstraint(error, EntitiesUniqueNameConstraint)) {
            return notOk.Conflict(nameConflictErrorMessage);
          } else if (
            databaseAdapter.isUniqueViolationOfConstraint(error, EntitiesUniqueUuidConstraint)
          ) {
            return notOk.Conflict(`Entity with id (${entity.id}) already exist`);
          }
          return notOk.GenericUnexpectedException(context, error);
        }
      );
      if (createResult.isError()) {
        return createResult;
      }
      const { id: entityId } = createResult.value;
      return ok({ uuid, actualName: name, entityId, createdAt: now, updatedAt: now });
    }
  );
}
