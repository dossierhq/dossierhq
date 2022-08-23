import { notOk, ok, type ErrorType, type PromiseResult } from '@jonasb/datadata-core';
import {
  PostgresQueryBuilder,
  type DatabaseAdminEntityCreateEntityArg,
  type DatabaseAdminEntityCreatePayload,
  type TransactionContext,
} from '@jonasb/datadata-database-adapter';
import {
  UniqueConstraints,
  type EntitiesTable,
  type EntityVersionsTable,
} from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone, queryOne } from '../QueryFunctions.js';
import { getSessionSubjectInternalId } from '../utils/SessionUtils.js';
import { withUniqueNameAttempt } from '../utils/withUniqueNameAttempt.js';
import { updateEntityLatestReferencesIndex } from './updateEntityLatestReferencesIndex.js';

export async function adminCreateEntity(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseAdminEntityCreateEntityArg
): PromiseResult<
  DatabaseAdminEntityCreatePayload,
  typeof ErrorType.Conflict | typeof ErrorType.Generic
> {
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
      text: 'INSERT INTO entity_versions (entities_id, version, created_by, data) VALUES ($1, 0, $2, $3) RETURNING id',
      values: [entityId, getSessionSubjectInternalId(entity.creator), entity.fieldsData],
    }
  );
  if (createEntityVersionResult.isError()) {
    return createEntityVersionResult;
  }
  const { id: versionsId } = createEntityVersionResult.value;

  const updateLatestDraftIdResult = await queryNone(databaseAdapter, context, {
    text: 'UPDATE entities SET latest_draft_entity_versions_id = $1 WHERE id = $2',
    values: [versionsId, entityId],
  });
  if (updateLatestDraftIdResult.isError()) {
    return updateLatestDraftIdResult;
  }

  const updateReferencesIndexResult = await updateEntityLatestReferencesIndex(
    databaseAdapter,
    context,
    { entityInternalId: entityId },
    entity.referenceIds,
    { skipDelete: true }
  );
  if (updateReferencesIndexResult.isError()) return updateReferencesIndexResult;

  if (entity.locations.length > 0) {
    const qb = new PostgresQueryBuilder(
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
    const insertLocationsResult = await queryNone(databaseAdapter, context, qb.build());
    if (insertLocationsResult.isError()) {
      return insertLocationsResult;
    }
  }

  return ok({ id: uuid, name: actualName, createdAt, updatedAt });
}

async function createEntityRow(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseAdminEntityCreateEntityArg
) {
  return await withUniqueNameAttempt(
    context,
    entity.name,
    randomNameGenerator,
    async (context, name, nameConflictErrorMessage) => {
      const qb = new PostgresQueryBuilder(
        'INSERT INTO entities (uuid, name, type, auth_key, resolved_auth_key, latest_fts, status)'
      );
      qb.addQuery(
        `VALUES (${qb.addValueOrDefault(entity.id)}, ${qb.addValue(name)}, ${qb.addValue(
          entity.type
        )}, ${qb.addValue(entity.resolvedAuthKey.authKey)}, ${qb.addValue(
          entity.resolvedAuthKey.resolvedAuthKey
        )}, to_tsvector(${qb.addValue(entity.fullTextSearchText)}), 'draft')`
      );
      qb.addQuery('RETURNING id, uuid, created_at, updated_at');
      const createResult = await queryOne<
        Pick<EntitiesTable, 'id' | 'uuid' | 'created_at' | 'updated_at'>,
        typeof ErrorType.Conflict
      >(databaseAdapter, context, qb.build(), (error) => {
        if (
          databaseAdapter.isUniqueViolationOfConstraint(error, UniqueConstraints.entities_name_key)
        ) {
          return notOk.Conflict(nameConflictErrorMessage);
        } else if (
          databaseAdapter.isUniqueViolationOfConstraint(error, UniqueConstraints.entities_uuid_key)
        ) {
          return notOk.Conflict(`Entity with id (${entity.id}) already exist`);
        }
        return notOk.GenericUnexpectedException(context, error);
      });
      if (createResult.isError()) {
        return createResult;
      }
      const {
        id: entityId,
        uuid,
        created_at: createdAt,
        updated_at: updatedAt,
      } = createResult.value;
      return ok({ uuid, actualName: name, entityId, createdAt, updatedAt });
    }
  );
}
