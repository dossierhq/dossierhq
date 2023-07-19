import type { EntityVersionReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityPublishGetVersionInfoPayload,
  DatabaseAdminEntityPublishUpdateEntityArg,
  DatabaseAdminEntityUpdateStatusPayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNoneOrOne, queryRun } from '../QueryFunctions.js';
import {
  resolveEntityFields,
  resolveEntityStatus,
  resolveEntityValidity,
} from '../utils/CodecUtils.js';
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
    Pick<EntityVersionsTable, 'id' | 'entities_id' | 'schema_version' | 'fields'> &
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
      >
  >(database, context, {
    text: `SELECT ev.id, ev.entities_id, ev.schema_version, ev.fields, e.type, e.auth_key, e.resolved_auth_key, e.status, e.updated_at, e.published_entity_versions_id, e.latest_entity_versions_id, e.invalid
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
    type,
    status,
    validPublished: validity.validPublished,
    updatedAt: new Date(updatedAt),
  });
}

export async function adminEntityPublishUpdateEntity(
  database: Database,
  context: TransactionContext,
  values: DatabaseAdminEntityPublishUpdateEntityArg,
): PromiseResult<DatabaseAdminEntityUpdateStatusPayload, typeof ErrorType.Generic> {
  const { entityVersionInternalId, status, entityInternalId } = values;

  const updatedSeqResult = await getEntitiesUpdatedSeq(database, context);
  if (updatedSeqResult.isError()) return updatedSeqResult;

  const now = new Date();

  const updateResult = await queryRun(database, context, {
    text: `UPDATE entities
           SET
             never_published = TRUE,
             published_entity_versions_id = ?1,
             updated_at = ?2,
             updated_seq = ?3,
             status = ?4,
             invalid = invalid & ~2,
             dirty = dirty & (~(2|8))
           WHERE id = ?5`,
    values: [
      entityVersionInternalId as number,
      now.toISOString(),
      updatedSeqResult.value,
      status,
      entityInternalId as number,
    ],
  });
  if (updateResult.isError()) return updateResult;

  return ok({ updatedAt: now });
}
