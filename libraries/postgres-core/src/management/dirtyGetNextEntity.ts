import { notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  createPostgresSqlQuery,
  type DatabaseManagementGetNextDirtyEntityPayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNoneOrOne } from '../QueryFunctions.js';
import { resolveAdminEntityInfo } from '../utils/CodecUtils.js';

export async function managementDirtyGetNextEntity(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext
): PromiseResult<
  DatabaseManagementGetNextDirtyEntityPayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const { sql, query } = createPostgresSqlQuery();
  sql`SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.dirty, e.invalid, ev.version, ev.data`;
  sql`FROM entities e, entity_versions ev WHERE e.dirty != 0 AND e.latest_draft_entity_versions_id = ev.id`;
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
      | 'dirty'
      | 'invalid'
    > &
      Pick<EntityVersionsTable, 'version' | 'data'>
  >(databaseAdapter, context, query);
  if (result.isError()) return result;
  if (!result.value) {
    return notOk.NotFound('No more dirty entities');
  }

  const {
    id: entityInternalId,
    uuid: id,
    resolved_auth_key: resolvedAuthKey,
    dirty,
    data: fieldValues,
  } = result.value;

  return ok({
    ...resolveAdminEntityInfo(result.value),
    entityInternalId,
    id,
    resolvedAuthKey,
    fieldValues,
    dirtyValidateLatest: !!(dirty & 1),
    dirtyValidatePublished: !!(dirty & 2),
    dirtyIndexLatest: !!(dirty & 4),
    dirtyIndexPublished: !!(dirty & 8),
  });
}