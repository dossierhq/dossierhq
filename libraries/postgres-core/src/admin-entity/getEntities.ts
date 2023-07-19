import type { EntityReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityGetOnePayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryMany } from '../QueryFunctions.js';
import { resolveAdminEntityInfo, resolveEntityFields } from '../utils/CodecUtils.js';

export async function adminEntityGetMultiple(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  references: EntityReference[],
): PromiseResult<DatabaseAdminEntityGetOnePayload[], typeof ErrorType.Generic> {
  const result = await queryMany<
    Pick<
      EntitiesTable,
      | 'uuid'
      | 'type'
      | 'name'
      | 'auth_key'
      | 'resolved_auth_key'
      | 'created_at'
      | 'updated_at'
      | 'status'
      | 'invalid'
    > &
      Pick<EntityVersionsTable, 'version' | 'schema_version' | 'data'>
  >(databaseAdapter, context, {
    text: `SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.invalid, ev.version, ev.schema_version, ev.data
    FROM entities e, entity_versions ev
    WHERE e.uuid = ANY($1)
    AND e.latest_draft_entity_versions_id = ev.id`,
    values: [references.map((it) => it.id)],
  });

  if (result.isError()) {
    return result;
  }

  return ok(
    result.value.map((row) => ({
      ...resolveAdminEntityInfo(row),
      ...resolveEntityFields(row),
      id: row.uuid,
      resolvedAuthKey: row.resolved_auth_key,
    })),
  );
}
