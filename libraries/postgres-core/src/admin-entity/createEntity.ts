/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
  EventType,
  notOk,
  ok,
  type CreateEntitySyncEvent,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import {
  buildPostgresSqlQuery,
  createPostgresSqlQuery,
  DEFAULT,
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
import { assertIsDefined } from '../utils/AssertUtils.js';
import { createEntityEvent } from '../utils/EventUtils.js';
import { getSessionSubjectInternalId } from '../utils/SessionUtils.js';
import { withUniqueNameAttempt } from '../utils/withUniqueNameAttempt.js';

export async function adminCreateEntity(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseAdminEntityCreateEntityArg,
  syncEvent: CreateEntitySyncEvent | null,
): PromiseResult<
  DatabaseAdminEntityCreatePayload,
  typeof ErrorType.Conflict | typeof ErrorType.Generic
> {
  const createEntityRowResult = await createEntityRow(
    databaseAdapter,
    context,
    randomNameGenerator,
    entity,
    syncEvent,
  );
  if (createEntityRowResult.isError()) return createEntityRowResult;
  const { uuid, actualName, entityId, createdAt, updatedAt } = createEntityRowResult.value;
  assertIsDefined(uuid);

  const createEntityVersionResult = await queryOne<Pick<EntityVersionsTable, 'id'>>(
    databaseAdapter,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      const createdBy = getSessionSubjectInternalId(entity.session);
      sql`INSERT INTO entity_versions (entities_id, type, name, version, created_at, schema_version, encode_version, created_by, data)`;
      sql`VALUES (${entityId}, ${entity.type}, ${actualName}, ${entity.version}, ${createdAt}, ${entity.schemaVersion}, ${entity.encodeVersion}, ${createdBy}, ${entity.fields}) RETURNING id`;
    }),
  );
  if (createEntityVersionResult.isError()) return createEntityVersionResult;
  const { id: versionsId } = createEntityVersionResult.value;

  const updateLatestDraftIdResult = await queryNone(databaseAdapter, context, {
    text: 'UPDATE entities SET latest_draft_entity_versions_id = $1 WHERE id = $2',
    values: [versionsId, entityId],
  });
  if (updateLatestDraftIdResult.isError()) return updateLatestDraftIdResult;

  const createEventResult = await createEntityEvent(
    databaseAdapter,
    context,
    entity.session,
    entity.publish ? EventType.createAndPublishEntity : EventType.createEntity,
    [{ entityVersionsId: versionsId }],
    syncEvent,
  );
  if (createEventResult.isError()) return createEventResult;

  return ok({ id: uuid, entityInternalId: entityId, name: actualName, createdAt, updatedAt });
}

async function createEntityRow(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseAdminEntityCreateEntityArg,
  syncEvent: CreateEntitySyncEvent | null,
) {
  return await withUniqueNameAttempt(
    context,
    entity.name,
    randomNameGenerator,
    async (context, name, nameConflictErrorMessage) => {
      const { sql, query } = createPostgresSqlQuery();
      const now = syncEvent?.createdAt ?? DEFAULT;
      const { authKey, resolvedAuthKey } = entity.resolvedAuthKey;
      const publishedName = entity.publish ? name : null;
      sql`INSERT INTO entities (uuid, name, created_at, updated_at, published_name, type, auth_key, resolved_auth_key, latest_fts, status)`;
      sql`VALUES (${entity.id ?? DEFAULT}, ${name}, ${now}, ${now}, ${publishedName}, ${
        entity.type
      }, ${authKey}, ${resolvedAuthKey}, to_tsvector(''), 'draft')`;
      sql`RETURNING id, uuid, created_at, updated_at`;
      const createResult = await queryOne<
        Pick<EntitiesTable, 'id' | 'uuid' | 'created_at' | 'updated_at'>,
        typeof ErrorType.Conflict
      >(databaseAdapter, context, query, (error) => {
        if (
          databaseAdapter.isUniqueViolationOfConstraint(
            error,
            UniqueConstraints.entities_name_key,
          ) ||
          databaseAdapter.isUniqueViolationOfConstraint(
            error,
            UniqueConstraints.entities_published_name_key,
          )
        ) {
          return notOk.Conflict(nameConflictErrorMessage);
        } else if (
          databaseAdapter.isUniqueViolationOfConstraint(error, UniqueConstraints.entities_uuid_key)
        ) {
          return notOk.Conflict(`Entity with id (${entity.id}) already exists`);
        }
        return notOk.GenericUnexpectedException(context, error);
      });
      if (createResult.isError()) return createResult;
      const {
        id: entityId,
        uuid,
        created_at: createdAt,
        updated_at: updatedAt,
      } = createResult.value;
      return ok({ uuid, actualName: name, entityId, createdAt, updatedAt });
    },
  );
}
