import { notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  createPostgresSqlQuery,
  type DatabaseAdminEntityWithResolvedReferencePayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNoneOrOne } from '../QueryFunctions.js';
import { resolveEntityStatus } from '../utils/CodecUtils.js';

export async function managementRevalidateGetNextEntity(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext
): PromiseResult<
  DatabaseAdminEntityWithResolvedReferencePayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const { sql, query } = createPostgresSqlQuery();
  sql`SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.valid, ev.version, ev.data`;
  sql`FROM entities e, entity_versions ev WHERE e.revalidate AND e.latest_draft_entity_versions_id = ev.id`;
  sql`LIMIT 1`;

  const result = await queryNoneOrOne<
    Pick<
      EntitiesTable,
      | 'id'
      | 'uuid'
      | 'type'
      | 'name'
      | 'auth_key'
      | 'resolved_auth_key'
      | 'created_at'
      | 'updated_at'
      | 'status'
      | 'valid'
    > &
      Pick<EntityVersionsTable, 'version' | 'data'>
  >(databaseAdapter, context, query);
  if (result.isError()) return result;
  if (!result.value) {
    return notOk.NotFound('No entity needing revalidation');
  }

  const {
    id: entityInternalId,
    uuid: id,
    type,
    name,
    version,
    auth_key: authKey,
    resolved_auth_key: resolvedAuthKey,
    status,
    valid,
    created_at: createdAt,
    updated_at: updatedAt,
    data: fieldValues,
  } = result.value;

  return ok({
    entityInternalId,
    id,
    type,
    name,
    version,
    authKey,
    resolvedAuthKey,
    status: resolveEntityStatus(status),
    valid,
    createdAt,
    updatedAt,
    fieldValues,
  });
}
