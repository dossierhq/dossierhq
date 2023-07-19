import type {
  EntityReference,
  EntityVersionReference,
  ErrorType,
  PromiseResult,
  UniqueIndexReference,
} from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntityGetOnePayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { createSqliteSqlQuery } from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNoneOrOne } from '../QueryFunctions.js';
import { resolveAdminEntityInfo, resolveEntityFields } from '../utils/CodecUtils.js';

export async function adminGetEntity(
  database: Database,
  context: TransactionContext,
  reference: EntityReference | EntityVersionReference | UniqueIndexReference,
): PromiseResult<
  DatabaseAdminEntityGetOnePayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result =
    'version' in reference
      ? await getEntityWithVersion(database, context, reference)
      : await getEntityWithLatestVersion(database, context, reference);
  if (result.isError()) {
    return result;
  }

  const row = result.value;

  return ok({
    ...resolveAdminEntityInfo(row),
    ...resolveEntityFields(row),
    id: row.uuid,
    resolvedAuthKey: row.resolved_auth_key,
  });
}

async function getEntityWithLatestVersion(
  database: Database,
  context: TransactionContext,
  reference: EntityReference | UniqueIndexReference,
) {
  const { sql, query } = createSqliteSqlQuery();
  sql`SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.invalid, ev.version, ev.schema_version, ev.fields`;
  if ('id' in reference) {
    sql`FROM entities e, entity_versions ev WHERE e.uuid = ${reference.id}`;
  } else {
    sql`FROM entities e, entity_versions ev, unique_index_values uiv WHERE uiv.index_name = ${reference.index} AND uiv.value = ${reference.value} AND uiv.latest AND uiv.entities_id = e.id`;
  }
  sql`AND e.latest_entity_versions_id = ev.id`;

  const result = await queryNoneOrOne<
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
      Pick<EntityVersionsTable, 'version' | 'schema_version' | 'fields'>
  >(database, context, query);
  if (result.isError()) return result;
  if (!result.value) {
    return notOk.NotFound('No such entity');
  }
  return ok(result.value);
}

async function getEntityWithVersion(
  database: Database,
  context: TransactionContext,
  reference: EntityVersionReference,
) {
  const result = await queryNoneOrOne<
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
      Pick<EntityVersionsTable, 'version' | 'schema_version' | 'fields'>
  >(database, context, {
    text: `SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.invalid, ev.version, ev.schema_version, ev.fields
    FROM entities e, entity_versions ev
    WHERE e.uuid = ?1
    AND e.id = ev.entities_id
    AND ev.version = ?2`,
    values: [reference.id, reference.version],
  });
  if (result.isError()) {
    return result;
  }
  if (!result.value) {
    return notOk.NotFound('No such entity or version');
  }
  return ok(result.value);
}
