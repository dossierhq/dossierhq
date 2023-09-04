import type {
  EntityVersionReference,
  ErrorType,
  PromiseResult,
  PublishEntitiesSyncEvent,
} from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import {
  buildPostgresSqlQuery,
  type DatabaseAdminEntityPublishGetVersionInfoPayload,
  type DatabaseAdminEntityPublishUpdateEntityArg,
  type DatabaseAdminEntityPublishUpdateEntityPayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import {
  ENTITY_DIRTY_FLAG_INDEX_PUBLISHED,
  ENTITY_DIRTY_FLAG_VALIDATE_PUBLISHED,
  UniqueConstraints,
  type EntitiesTable,
  type EntityVersionsTable,
} from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone, queryNoneOrOne, queryOne } from '../QueryFunctions.js';
import {
  resolveEntityFields,
  resolveEntityStatus,
  resolveEntityValidity,
} from '../utils/CodecUtils.js';
import { withUniqueNameAttempt } from '../utils/withUniqueNameAttempt.js';

export async function adminEntityPublishGetVersionInfo(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: EntityVersionReference,
): PromiseResult<
  DatabaseAdminEntityPublishGetVersionInfoPayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result = await queryNoneOrOne<
    Pick<
      EntityVersionsTable,
      'id' | 'entities_id' | 'name' | 'schema_version' | 'encode_version' | 'data'
    > &
      Pick<
        EntitiesTable,
        | 'type'
        | 'auth_key'
        | 'resolved_auth_key'
        | 'status'
        | 'invalid'
        | 'updated_at'
        | 'published_entity_versions_id'
        | 'latest_draft_entity_versions_id'
        | 'published_name'
      >
  >(databaseAdapter, context, {
    text: `SELECT ev.id, ev.entities_id, ev.name, ev.schema_version, ev.encode_version, ev.data, e.type, e.auth_key, e.resolved_auth_key, e.status, e.invalid, e.updated_at, e.published_entity_versions_id, e.latest_draft_entity_versions_id, e.published_name
         FROM entity_versions ev, entities e
         WHERE e.uuid = $1 AND e.id = ev.entities_id AND ev.version = $2`,
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
    name,
    published_name: publishedName,
  } = result.value;

  const status = resolveEntityStatus(result.value.status);
  const validity = resolveEntityValidity(result.value.invalid, status);

  return ok({
    ...resolveEntityFields(result.value),
    entityInternalId,
    entityVersionInternalId,
    versionIsPublished: entityVersionInternalId === result.value.published_entity_versions_id,
    versionIsLatest: entityVersionInternalId === result.value.latest_draft_entity_versions_id,
    authKey,
    resolvedAuthKey,
    name,
    publishedName,
    type,
    status,
    validPublished: validity.validPublished,
    updatedAt,
  });
}

export async function adminEntityPublishUpdateEntity(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  randomNameGenerator: (name: string) => string,
  values: DatabaseAdminEntityPublishUpdateEntityArg,
  _syncEvent: PublishEntitiesSyncEvent | null,
): PromiseResult<DatabaseAdminEntityPublishUpdateEntityPayload, typeof ErrorType.Generic> {
  const { entityVersionInternalId, status, entityInternalId } = values;

  const updateResult = await queryOne<Pick<EntitiesTable, 'updated_at'>>(databaseAdapter, context, {
    text: `UPDATE entities
          SET
            never_published = FALSE,
            archived = FALSE,
            published_entity_versions_id = $1,
            updated_at = NOW(),
            updated = nextval('entities_updated_seq'),
            status = $2,
            invalid = invalid & ~2,
            dirty = dirty & $3
          WHERE id = $4
          RETURNING updated_at`,
    values: [
      entityVersionInternalId,
      status,
      ~(ENTITY_DIRTY_FLAG_VALIDATE_PUBLISHED | ENTITY_DIRTY_FLAG_INDEX_PUBLISHED),
      entityInternalId,
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
        const updateNameResult = await queryNone(
          databaseAdapter,
          context,
          buildPostgresSqlQuery(({ sql }) => {
            sql`UPDATE entities SET published_name = ${name} WHERE id = ${entityInternalId}`;
          }),
          (error) => {
            if (
              databaseAdapter.isUniqueViolationOfConstraint(
                error,
                UniqueConstraints.entities_published_name_key,
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

  const { updated_at: updatedAt } = updateResult.value;
  return ok({ updatedAt, publishedName: newPublishedName });
}
