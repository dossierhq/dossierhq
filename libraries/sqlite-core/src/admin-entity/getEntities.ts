import type { EntityReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityGetOnePayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { createSqliteSqlQuery } from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';
import { resolveAdminEntityInfo } from '../utils/CodecUtils.js';

export async function adminEntityGetMultiple(
  database: Database,
  context: TransactionContext,
  references: EntityReference[]
): PromiseResult<DatabaseAdminEntityGetOnePayload[], typeof ErrorType.Generic> {
  const { addValueList, query, sql } = createSqliteSqlQuery();
  const uuids = addValueList(references.map((it) => it.id));
  sql`SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.invalid, ev.version, ev.fields`;
  sql`FROM entities e, entity_versions ev WHERE e.uuid IN ${uuids} AND e.latest_entity_versions_id = ev.id`;

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
      Pick<EntityVersionsTable, 'version' | 'fields'>
  >(database, context, query);

  if (result.isError()) return result;

  return ok(
    result.value.map((row) => ({
      ...resolveAdminEntityInfo(row),
      id: row.uuid,
      resolvedAuthKey: row.resolved_auth_key,
      fieldValues: JSON.parse(row.fields),
    }))
  );
}
