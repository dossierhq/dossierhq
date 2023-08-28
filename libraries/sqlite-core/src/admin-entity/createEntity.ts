import { EventType, notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type DatabaseAdminEntityCreateEntityArg,
  type DatabaseAdminEntityCreatePayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import {
  EntitiesUniqueNameConstraint,
  EntitiesUniquePublishedNameConstraint,
  EntitiesUniqueUuidConstraint,
} from '../DatabaseSchema.js';
import { queryOne, queryRun, type Database } from '../QueryFunctions.js';
import { getTransactionTimestamp } from '../SqliteTransaction.js';
import { createEntityEvent } from '../utils/EventUtils.js';
import { getSessionSubjectInternalId } from '../utils/SessionUtils.js';
import { withUniqueNameAttempt } from '../utils/withUniqueNameAttempt.js';
import { getEntitiesUpdatedSeq } from './getEntitiesUpdatedSeq.js';

export async function adminCreateEntity(
  database: Database,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseAdminEntityCreateEntityArg,
): PromiseResult<
  DatabaseAdminEntityCreatePayload,
  typeof ErrorType.Conflict | typeof ErrorType.Generic
> {
  const createEntityRowResult = await createEntityRow(
    database,
    context,
    randomNameGenerator,
    entity,
  );
  if (createEntityRowResult.isError()) return createEntityRowResult;

  const { uuid, actualName, entityId, createdAt, updatedAt } = createEntityRowResult.value;

  const createEntityVersionResult = await queryOne<Pick<EntityVersionsTable, 'id'>>(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      const createdBy = getSessionSubjectInternalId(entity.session);
      sql`INSERT INTO entity_versions (entities_id, type, name, version, created_at, created_by, schema_version, encode_version, fields)`;
      sql`VALUES (${entityId}, ${entity.type}, ${actualName}, ${
        entity.version
      }, ${createdAt.toISOString()}, ${createdBy}, ${entity.schemaVersion}, ${
        entity.encodeVersion
      }, ${JSON.stringify(entity.fields)}) RETURNING id`;
    }),
  );
  if (createEntityVersionResult.isError()) return createEntityVersionResult;
  const { id: versionsId } = createEntityVersionResult.value;

  const updateLatestDraftIdResult = await queryRun(database, context, {
    text: 'UPDATE entities SET latest_entity_versions_id = ?1 WHERE id = ?2',
    values: [versionsId, entityId],
  });
  if (updateLatestDraftIdResult.isError()) return updateLatestDraftIdResult;

  const createEventResult = await createEntityEvent(
    database,
    context,
    entity.session,
    entity.publish ? EventType.createAndPublishEntity : EventType.createEntity,
    [{ entityVersionsId: versionsId }],
  );
  if (createEventResult.isError()) return createEventResult;

  return ok({ id: uuid, entityInternalId: entityId, name: actualName, createdAt, updatedAt });
}

async function createEntityRow(
  database: Database,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseAdminEntityCreateEntityArg,
) {
  const uuid = entity.id ?? database.adapter.randomUUID();
  const now = getTransactionTimestamp(context.transaction);

  const updatedSecResult = await getEntitiesUpdatedSeq(database, context);
  if (updatedSecResult.isError()) return updatedSecResult;

  return await withUniqueNameAttempt(
    context,
    entity.name,
    randomNameGenerator,
    async (context, name, nameConflictErrorMessage) => {
      const publishedName = entity.publish ? name : null;
      const createResult = await queryOne<Pick<EntitiesTable, 'id'>, typeof ErrorType.Conflict>(
        database,
        context,
        buildSqliteSqlQuery(({ sql, addValue }) => {
          const nowValue = addValue(now.toISOString());
          sql`INSERT INTO entities (uuid, name, published_name, type, auth_key, resolved_auth_key, status, created_at, updated_at, updated_seq)`;
          sql`VALUES (${uuid}, ${name}, ${publishedName}, ${entity.type}, ${entity.resolvedAuthKey.authKey}, ${entity.resolvedAuthKey.resolvedAuthKey}, 'draft', ${nowValue}, ${nowValue}, ${updatedSecResult.value})`;
          sql`RETURNING id`;
        }),
        (error) => {
          if (
            database.adapter.isUniqueViolationOfConstraint(error, EntitiesUniqueNameConstraint) ||
            database.adapter.isUniqueViolationOfConstraint(
              error,
              EntitiesUniquePublishedNameConstraint,
            )
          ) {
            return notOk.Conflict(nameConflictErrorMessage);
          } else if (
            database.adapter.isUniqueViolationOfConstraint(error, EntitiesUniqueUuidConstraint)
          ) {
            return notOk.Conflict(`Entity with id (${entity.id}) already exist`);
          }
          return notOk.GenericUnexpectedException(context, error);
        },
      );
      if (createResult.isError()) return createResult;
      const { id: entityId } = createResult.value;

      return ok({ uuid, actualName: name, entityId, createdAt: now, updatedAt: now });
    },
  );
}
