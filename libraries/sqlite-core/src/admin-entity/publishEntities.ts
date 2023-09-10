import type {
  CreateEntitySyncEvent,
  EntityVersionReference,
  ErrorType,
  PromiseResult,
  PublishEntitiesSyncEvent,
  UpdateEntitySyncEvent,
} from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type DatabaseAdminEntityPublishGetVersionInfoPayload,
  type DatabaseAdminEntityPublishUpdateEntityArg,
  type DatabaseAdminEntityPublishUpdateEntityPayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import {
  ENTITY_DIRTY_FLAG_INDEX_PUBLISHED,
  ENTITY_DIRTY_FLAG_VALIDATE_PUBLISHED,
  EntitiesUniquePublishedNameConstraint,
  type EntitiesTable,
  type EntityVersionsTable,
} from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNoneOrOne, queryRun } from '../QueryFunctions.js';
import { getTransactionTimestamp } from '../SqliteTransaction.js';
import {
  resolveEntityFields,
  resolveEntityStatus,
  resolveEntityValidity,
} from '../utils/CodecUtils.js';
import { withUniqueNameAttempt } from '../utils/withUniqueNameAttempt.js';
import { getEntitiesUpdatedSeq } from './getEntitiesUpdatedSeq.js';

export async function adminEntityPublishGetVersionInfo(
  database: Database,
  context: TransactionContext,
  reference: EntityVersionReference,
): PromiseResult<
  DatabaseAdminEntityPublishGetVersionInfoPayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result = await queryNoneOrOne<
    Pick<
      EntityVersionsTable,
      'id' | 'entities_id' | 'name' | 'schema_version' | 'encode_version' | 'fields'
    > &
      Pick<
        EntitiesTable,
        | 'type'
        | 'auth_key'
        | 'resolved_auth_key'
        | 'status'
        | 'updated_at'
        | 'published_entity_versions_id'
        | 'latest_entity_versions_id'
        | 'invalid'
        | 'published_name'
      >
  >(database, context, {
    text: `SELECT ev.id, ev.entities_id, ev.name, ev.schema_version, ev.encode_version, ev.fields, e.type, e.auth_key, e.resolved_auth_key, e.status, e.updated_at, e.published_entity_versions_id, e.latest_entity_versions_id, e.invalid, e.published_name
         FROM entity_versions ev, entities e
         WHERE e.uuid = ?1 AND e.id = ev.entities_id AND ev.version = ?2`,
    values: [reference.id, reference.version],
  });

  if (result.isError()) return result;
  if (!result.value) {
    return notOk.NotFound('No such entity or version');
  }

  const {
    id: entityVersionInternalId,
    entities_id: entityInternalId,
    type,
    auth_key: authKey,
    resolved_auth_key: resolvedAuthKey,
    updated_at: updatedAt,
    invalid,
    name,
    published_name: publishedName,
  } = result.value;

  const status = resolveEntityStatus(result.value.status);
  const validity = resolveEntityValidity(invalid, status);

  return ok({
    ...resolveEntityFields(result.value),
    entityInternalId,
    entityVersionInternalId,
    versionIsPublished: entityVersionInternalId === result.value.published_entity_versions_id,
    versionIsLatest: entityVersionInternalId === result.value.latest_entity_versions_id,
    authKey,
    resolvedAuthKey,
    name,
    publishedName,
    type,
    status,
    validPublished: validity.validPublished,
    updatedAt: new Date(updatedAt),
  });
}

export async function adminEntityPublishUpdateEntity(
  database: Database,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  values: DatabaseAdminEntityPublishUpdateEntityArg,
  syncEvent: PublishEntitiesSyncEvent | CreateEntitySyncEvent | UpdateEntitySyncEvent | null,
): PromiseResult<DatabaseAdminEntityPublishUpdateEntityPayload, typeof ErrorType.Generic> {
  const { entityVersionInternalId, status, entityInternalId } = values;

  const updatedSeqResult = await getEntitiesUpdatedSeq(database, context);
  if (updatedSeqResult.isError()) return updatedSeqResult;

  const now = syncEvent?.createdAt ?? getTransactionTimestamp(context.transaction);

  const updateResult = await queryRun(database, context, {
    text: `UPDATE entities
           SET
             never_published = FALSE,
             published_entity_versions_id = ?1,
             updated_at = ?2,
             updated_seq = ?3,
             status = ?4,
             invalid = invalid & ~2,
             dirty = dirty & ?5
           WHERE id = ?6`,
    values: [
      entityVersionInternalId as number,
      now.toISOString(),
      updatedSeqResult.value,
      status,
      // reset published flags
      ~(ENTITY_DIRTY_FLAG_VALIDATE_PUBLISHED | ENTITY_DIRTY_FLAG_INDEX_PUBLISHED),
      entityInternalId as number,
    ],
  });
  if (updateResult.isError()) return updateResult;

  let newPublishedName = values.publishedName;
  if (values.changePublishedName) {
    const nameResult = await withUniqueNameAttempt(
      context,
      newPublishedName,
      randomNameGenerator,
      async (context, name, nameConflictErrorMessage) => {
        const updateNameResult = await queryRun(
          database,
          context,
          buildSqliteSqlQuery(({ sql }) => {
            sql`UPDATE entities SET published_name = ${name} WHERE id = ${
              entityInternalId as number
            }`;
          }),
          (error) => {
            if (
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
    newPublishedName = nameResult.value;
  }

  return ok({ updatedAt: now, publishedName: newPublishedName });
}
