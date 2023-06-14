import { notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  DEFAULT,
  createPostgresSqlQuery,
  type DatabaseAdminEntityCreateEntityArg,
  type DatabaseAdminEntityCreatePayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import {
  UniqueConstraints,
  type EntitiesTable,
  type EntityVersionsTable,
} from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone, queryOne } from '../QueryFunctions.js';
import { getSessionSubjectInternalId } from '../utils/SessionUtils.js';
import { withUniqueNameAttempt } from '../utils/withUniqueNameAttempt.js';
import { updateLatestEntityIndexes } from './updateLatestEntityIndexes.js';

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
  if (createEntityRowResult.isError()) return createEntityRowResult;

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

  const updateReferencesIndexResult = await updateLatestEntityIndexes(
    databaseAdapter,
    context,
    { entityInternalId: entityId },
    entity,
    { skipDelete: true }
  );
  if (updateReferencesIndexResult.isError()) return updateReferencesIndexResult;

  return ok({ id: uuid, entityInternalId: entityId, name: actualName, createdAt, updatedAt });
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
      const { sql, query } = createPostgresSqlQuery();
      sql`INSERT INTO entities (uuid, name, type, auth_key, resolved_auth_key, latest_fts, status)`;
      sql`VALUES (${entity.id ?? DEFAULT}, ${name}, ${entity.type}, ${
        entity.resolvedAuthKey.authKey
      }, ${entity.resolvedAuthKey.resolvedAuthKey}, to_tsvector(''), 'draft')`;
      sql`RETURNING id, uuid, created_at, updated_at`;
      const createResult = await queryOne<
        Pick<EntitiesTable, 'id' | 'uuid' | 'created_at' | 'updated_at'>,
        typeof ErrorType.Conflict
      >(databaseAdapter, context, query, (error) => {
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
