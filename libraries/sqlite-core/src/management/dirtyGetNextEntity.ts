import { notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type {
  DatabaseManagementGetNextDirtyEntityPayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import { queryNoneOrOne, type Database } from '../QueryFunctions.js';
import { resolveAdminEntityInfo } from '../utils/CodecUtils.js';

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
  Pick<EntityVersionsTable, 'version' | 'fields'>;

const QUERY =
  'WITH entities_cte AS (SELECT id FROM entities WHERE dirty != 0 LIMIT 1) ' +
  'SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.dirty, e.invalid, ev.version, ev.fields ' +
  'FROM entities_cte, entities e, entity_versions ev WHERE entities_cte.id = e.id AND e.latest_entity_versions_id = ev.id';

export async function managementDirtyGetNextEntity(
  database: Database,
  context: TransactionContext
): PromiseResult<
  DatabaseManagementGetNextDirtyEntityPayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result = await queryNoneOrOne<EntityRow>(database, context, QUERY);
  if (result.isError()) return result;
  if (!result.value) {
    return notOk.NotFound('No more dirty entities');
  }

  const {
    id: entityInternalId,
    uuid: id,
    resolved_auth_key: resolvedAuthKey,
    dirty,
    fields: fieldValues,
  } = result.value;

  return ok({
    ...resolveAdminEntityInfo(result.value),
    entityInternalId,
    id,
    resolvedAuthKey,
    fieldValues: JSON.parse(fieldValues),
    dirtyValidateLatest: !!(dirty & 1),
    dirtyValidatePublished: !!(dirty & 2),
    dirtyIndexLatest: !!(dirty & 4),
    dirtyIndexPublished: !!(dirty & 8),
  });
}
