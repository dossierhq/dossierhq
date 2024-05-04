import {
  EventType,
  notOk,
  ok,
  type EntityReference,
  type ErrorType,
  type PromiseResult,
  type UpdateEntitySyncEvent,
} from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type DatabaseEntityUpdateEntityArg,
  type DatabaseEntityUpdateEntityPayload,
  type DatabaseEntityUpdateGetEntityInfoPayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import {
  EntitiesUniqueNameConstraint,
  EntitiesUniquePublishedNameConstraint,
  ENTITY_DIRTY_FLAG_INDEX_LATEST,
  ENTITY_DIRTY_FLAG_VALIDATE_LATEST,
  type EntitiesTable,
  type EntityVersionsTable,
} from '../DatabaseSchema.js';
import { queryNoneOrOne, queryOne, queryRun, type Database } from '../QueryFunctions.js';
import { getTransactionTimestamp } from '../SqliteTransaction.js';
import { resolveAdminEntityInfo, resolveEntityFields } from '../utils/CodecUtils.js';
import { createEntityEvent } from '../utils/EventUtils.js';
import { getSessionSubjectInternalId } from '../utils/SessionUtils.js';
import { withUniqueNameAttempt } from '../utils/withUniqueNameAttempt.js';
import { getEntitiesUpdatedSeq } from './getEntitiesUpdatedSeq.js';

export async function adminEntityUpdateGetEntityInfo(
  database: Database,
  context: TransactionContext,
  reference: EntityReference,
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
      | 'published_name'
      | 'auth_key'
      | 'resolved_auth_key'
      | 'created_at'
      | 'updated_at'
      | 'status'
      | 'invalid'
    > &
      Pick<EntityVersionsTable, 'version' | 'schema_version' | 'encode_version' | 'fields'>
  >(database, context, {
    text: `SELECT e.id, e.type, e.name, e.published_name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.invalid, ev.version, ev.schema_version, ev.encode_version, ev.fields
        FROM entities e, entity_versions ev
        WHERE e.uuid = ?1 AND e.latest_entity_versions_id = ev.id`,
    values: [reference.id],
  });
  if (result.isError()) return result;

  if (!result.value) {
    return notOk.NotFound('No such entity');
  }

  const {
    id: entityInternalId,
    published_name: publishedName,
    resolved_auth_key: resolvedAuthKey,
  } = result.value;

  return ok({
    ...resolveAdminEntityInfo(result.value),
    ...resolveEntityFields(result.value),
    entityInternalId,
    publishedName,
    resolvedAuthKey,
  });
}

export async function adminEntityUpdateEntity(
  database: Database,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  entity: DatabaseEntityUpdateEntityArg,
  syncEvent: UpdateEntitySyncEvent | null,
): PromiseResult<DatabaseEntityUpdateEntityPayload, typeof ErrorType.Generic> {
  const now = syncEvent?.createdAt ?? getTransactionTimestamp(context.transaction);

  const createVersionResult = await queryOne<Pick<EntityVersionsTable, 'id'>>(database, context, {
    text: 'INSERT INTO entity_versions (entities_id, created_at, created_by, type, name, version, schema_version, encode_version, fields) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9) RETURNING id',
    values: [
      entity.entityInternalId as number,
      now.toISOString(),
      getSessionSubjectInternalId(entity.session),
      entity.type,
      entity.name,
      entity.version,
      entity.schemaVersion,
      entity.encodeVersion,
      JSON.stringify(entity.fields),
    ],
  });
  if (createVersionResult.isError()) return createVersionResult;
  const { id: versionsId } = createVersionResult.value;

  let newName = entity.name;
  if (entity.changeName) {
    const nameResult = await withUniqueNameAttempt(
      context,
      entity.name,
      randomNameGenerator,
      async (context, name, nameConflictErrorMessage) => {
        const updateNameResult = await queryRun(
          database,
          context,
          buildSqliteSqlQuery(({ sql }) => {
            sql`UPDATE entities SET name = ${name}`;
            if (entity.publish) {
              sql`, published_name = ${name}`;
            }
            sql`WHERE id = ${entity.entityInternalId as number}`;
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
            }
            return notOk.GenericUnexpectedException(context, error);
          },
        );
        if (updateNameResult.isError()) return updateNameResult;

        return ok(name);
      },
    );

    if (nameResult.isError()) return nameResult;
    newName = nameResult.value;

    const updateNameResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql }) => {
        sql`UPDATE entity_versions SET name = ${newName} WHERE id = ${versionsId}`;
      }),
    );
    if (updateNameResult.isError()) return updateNameResult;
  }

  const updatedReqResult = await getEntitiesUpdatedSeq(database, context);
  if (updatedReqResult.isError()) return updatedReqResult;

  const updateEntityResult = await queryRun(database, context, {
    text: `UPDATE entities SET
             latest_entity_versions_id = ?1,
             updated_at = ?2,
             updated_seq = ?3,
             status = ?4,
             invalid = invalid & ~1,
             dirty = dirty & ?5
           WHERE id = ?6`,
    values: [
      versionsId,
      now.toISOString(),
      updatedReqResult.value,
      entity.status,
      // reset latest flags
      ~(ENTITY_DIRTY_FLAG_VALIDATE_LATEST | ENTITY_DIRTY_FLAG_INDEX_LATEST),
      entity.entityInternalId as number,
    ],
  });
  if (updateEntityResult.isError()) return updateEntityResult;

  const createEventResult = await createEntityEvent(
    database,
    context,
    entity.session,
    entity.publish ? EventType.updateAndPublishEntity : EventType.updateEntity,
    [{ entityVersionsId: versionsId }],
    syncEvent,
  );
  if (createEventResult.isError()) return createEventResult;

  return ok({ name: newName, updatedAt: now });
}
