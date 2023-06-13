import { notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type {
  DatabaseAdminEntityWithResolvedReferencePayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import { queryNoneOrOne, type Database } from '../QueryFunctions.js';
import { resolveEntityStatus } from '../utils/CodecUtils.js';

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
  | 'valid'
> &
  Pick<EntityVersionsTable, 'version' | 'fields'>;

// dirty & 1 (validate_latest) = 1, 3, 5, 7, 9, 11, 13, 15
const QUERY =
  'WITH entities_cte AS (SELECT id FROM entities WHERE dirty IN (1, 3, 5, 7, 9, 11, 13, 15) LIMIT 1) ' +
  'SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.valid, ev.version, ev.fields ' +
  'FROM entities_cte, entities e, entity_versions ev WHERE entities_cte.id = e.id AND e.latest_entity_versions_id = ev.id';

export async function managementRevalidateGetNextEntity(
  database: Database,
  context: TransactionContext
): PromiseResult<
  DatabaseAdminEntityWithResolvedReferencePayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result = await queryNoneOrOne<EntityRow>(database, context, QUERY);
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
    fields: fieldValues,
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
    valid: !!valid,
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
    fieldValues: JSON.parse(fieldValues),
  });
}
