import { notOk, ok, type ErrorType, type PromiseResult } from '@jonasb/datadata-core';
import {
  buildSqliteSqlQuery,
  type DatabaseAdminEntityCreateEntityArg,
  type DatabaseAdminEntityCreatePayload,
  type TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import { v4 as uuidv4 } from 'uuid';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import { EntitiesUniqueNameConstraint, EntitiesUniqueUuidConstraint } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNone, queryOne } from '../QueryFunctions.js';
import { getSessionSubjectInternalId } from '../utils/SessionUtils.js';
import { withUniqueNameAttempt } from '../utils/withUniqueNameAttempt.js';
import { getEntitiesUpdatedSeq } from './getEntitiesUpdatedSeq.js';
import { updateEntityLatestReferencesAndLocationsIndexes } from './updateEntityLatestReferencesAndLocationsIndexes.js';

export async function adminCreateEntity(
  database: Database,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseAdminEntityCreateEntityArg
): PromiseResult<
  DatabaseAdminEntityCreatePayload,
  typeof ErrorType.Conflict | typeof ErrorType.Generic
> {
  const createEntityRowResult = await createEntityRow(
    database,
    context,
    randomNameGenerator,
    entity
  );
  if (createEntityRowResult.isError()) {
    return createEntityRowResult;
  }

  const { uuid, actualName, entityId, createdAt, updatedAt } = createEntityRowResult.value;

  const ftsResult = await queryNone(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql }) =>
        sql`INSERT INTO entities_latest_fts (docid, content) VALUES (${entityId}, ${entity.fullTextSearchText})`
    )
  );
  if (ftsResult.isError()) return ftsResult;

  const createEntityVersionResult = await queryOne<Pick<EntityVersionsTable, 'id'>>(
    database,
    context,
    {
      text: 'INSERT INTO entity_versions (entities_id, version, created_at, created_by, fields) VALUES (?1, 0, ?2, ?3, ?4) RETURNING id',
      values: [
        entityId,
        createdAt.toString(),
        getSessionSubjectInternalId(entity.creator),
        JSON.stringify(entity.fieldsData),
      ],
    }
  );
  if (createEntityVersionResult.isError()) {
    return createEntityVersionResult;
  }
  const { id: versionsId } = createEntityVersionResult.value;

  const updateLatestDraftIdResult = await queryNone(database, context, {
    text: 'UPDATE entities SET latest_entity_versions_id = ?1 WHERE id = ?2',
    values: [versionsId, entityId],
  });
  if (updateLatestDraftIdResult.isError()) {
    return updateLatestDraftIdResult;
  }

  const updateReferencesIndexResult = await updateEntityLatestReferencesAndLocationsIndexes(
    database,
    context,
    { entityInternalId: entityId },
    entity.referenceIds,
    entity.locations,
    { skipDelete: true }
  );
  if (updateReferencesIndexResult.isError()) return updateReferencesIndexResult;

  return ok({ id: uuid, name: actualName, createdAt, updatedAt });
}

async function createEntityRow(
  database: Database,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseAdminEntityCreateEntityArg
) {
  const uuid = entity.id ?? uuidv4();
  const now = Temporal.Now.instant();

  const updatedSecResult = await getEntitiesUpdatedSeq(database, context);
  if (updatedSecResult.isError()) return updatedSecResult;

  return await withUniqueNameAttempt(
    context,
    entity.name,
    randomNameGenerator,
    async (context, name, nameConflictErrorMessage) => {
      const createResult = await queryOne<Pick<EntitiesTable, 'id'>, typeof ErrorType.Conflict>(
        database,
        context,
        {
          text: `INSERT INTO entities (uuid, name, type, auth_key, resolved_auth_key, status, created_at, updated_at, updated_seq)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7, ?8) RETURNING id`,
          values: [
            uuid,
            name,
            entity.type,
            entity.resolvedAuthKey.authKey,
            entity.resolvedAuthKey.resolvedAuthKey,
            'draft',
            now.toString(),
            updatedSecResult.value,
          ],
        },
        (error) => {
          if (database.adapter.isUniqueViolationOfConstraint(error, EntitiesUniqueNameConstraint)) {
            return notOk.Conflict(nameConflictErrorMessage);
          } else if (
            database.adapter.isUniqueViolationOfConstraint(error, EntitiesUniqueUuidConstraint)
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
