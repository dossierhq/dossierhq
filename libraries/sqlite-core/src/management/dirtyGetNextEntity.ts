import {
  notOk,
  ok,
  type EntityReference,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import {
  createSqliteSqlQuery,
  type DatabaseManagementGetNextDirtyEntityPayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import {
  ENTITY_DIRTY_FLAG_INDEX_LATEST,
  ENTITY_DIRTY_FLAG_INDEX_PUBLISHED,
  ENTITY_DIRTY_FLAG_VALIDATE_LATEST,
  ENTITY_DIRTY_FLAG_VALIDATE_PUBLISHED,
  type EntitiesTable,
  type EntityVersionsTable,
} from '../DatabaseSchema.js';
import { queryNoneOrOne, type Database } from '../QueryFunctions.js';
import { resolveAdminEntityInfo, resolveEntityFields } from '../utils/CodecUtils.js';

type EntityRow = Pick<
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
  Pick<EntityVersionsTable, 'version' | 'schema_version' | 'fields'>;

export async function managementDirtyGetNextEntity(
  database: Database,
  context: TransactionContext,
  filter: EntityReference | undefined,
): PromiseResult<
  DatabaseManagementGetNextDirtyEntityPayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const { sql, query } = createSqliteSqlQuery();
  sql`WITH entities_cte AS (SELECT id FROM entities WHERE dirty != 0 LIMIT 1)`;
  sql`SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.dirty, e.invalid, ev.version, ev.schema_version, ev.fields`;
  sql`FROM entities_cte, entities e, entity_versions ev WHERE entities_cte.id = e.id AND e.latest_entity_versions_id = ev.id`;
  if (filter) {
    sql`AND e.uuid = ${filter.id}`;
  }

  const result = await queryNoneOrOne<EntityRow>(database, context, query);
  if (result.isError()) return result;
  if (!result.value) {
    return notOk.NotFound('No more dirty entities');
  }

  const {
    id: entityInternalId,
    uuid: id,
    resolved_auth_key: resolvedAuthKey,
    dirty,
  } = result.value;

  return ok({
    ...resolveAdminEntityInfo(result.value),
    ...resolveEntityFields(result.value),
    entityInternalId,
    id,
    resolvedAuthKey,
    dirtyValidateLatest: !!(dirty & ENTITY_DIRTY_FLAG_VALIDATE_LATEST),
    dirtyValidatePublished: !!(dirty & ENTITY_DIRTY_FLAG_VALIDATE_PUBLISHED),
    dirtyIndexLatest: !!(dirty & ENTITY_DIRTY_FLAG_INDEX_LATEST),
    dirtyIndexPublished: !!(dirty & ENTITY_DIRTY_FLAG_INDEX_PUBLISHED),
  });
}
