import {
  notOk,
  ok,
  type EntityReference,
  type EntityVersionReference,
  type ErrorType,
  type PromiseResult,
  type UniqueIndexReference,
} from '@dossierhq/core';
import {
  createPostgresSqlQuery,
  type DatabaseAdminEntityGetOnePayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNoneOrOne } from '../QueryFunctions.js';
import { resolveAdminEntityInfo, resolveEntityFields } from '../utils/CodecUtils.js';

export async function adminGetEntity(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference | EntityVersionReference | UniqueIndexReference,
): PromiseResult<
  DatabaseAdminEntityGetOnePayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const result =
    'version' in reference
      ? await getEntityWithVersion(databaseAdapter, context, reference)
      : await getEntityWithLatestVersion(databaseAdapter, context, reference);
  if (result.isError()) return result;
  const { uuid: id, resolved_auth_key: resolvedAuthKey } = result.value;

  return ok({
    ...resolveAdminEntityInfo(result.value),
    ...resolveEntityFields(result.value),
    id,
    resolvedAuthKey,
  });
}

async function getEntityWithLatestVersion(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference | UniqueIndexReference,
) {
  const { sql, query } = createPostgresSqlQuery();
  sql`SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, e.invalid, ev.version, ev.schema_version, ev.encode_version, ev.data, s.uuid AS subjects_uuid`;
  if ('id' in reference) {
    sql`FROM entities e, entity_versions ev, subjects s WHERE e.uuid = ${reference.id}`;
  } else {
    sql`FROM entities e, entity_versions ev, unique_index_values uiv, subjects s WHERE uiv.index_name = ${reference.index} AND uiv.value = ${reference.value} AND uiv.latest AND uiv.entities_id = e.id`;
  }
  sql`AND e.latest_draft_entity_versions_id = ev.id AND ev.created_by = s.id`;

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
      Pick<EntityVersionsTable, 'version' | 'schema_version' | 'encode_version' | 'data'> & {
        subjects_uuid: string;
      }
  >(databaseAdapter, context, query);
  if (result.isError()) return result;
  if (!result.value) {
    return notOk.NotFound('No such entity');
  }
  return ok(result.value);
}

async function getEntityWithVersion(
  databaseAdapter: PostgresDatabaseAdapter,
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
      | 'status'
      | 'invalid'
    > &
      Pick<
        EntityVersionsTable,
        'name' | 'version' | 'schema_version' | 'encode_version' | 'data'
      > & { updated_at: EntityVersionsTable['created_at'] }
  >(databaseAdapter, context, {
    text: `SELECT e.uuid, e.type, e.auth_key, e.resolved_auth_key, e.created_at, e.status, e.invalid, ev.name, ev.version, ev.schema_version, ev.encode_version, ev.data, ev.created_at AS updated_at
    FROM entities e, entity_versions ev
    WHERE e.uuid = $1
    AND e.id = ev.entities_id
    AND ev.version = $2`,
    values: [reference.id, reference.version],
  });
  if (result.isError()) return result;
  if (!result.value) {
    return notOk.NotFound('No such entity or version');
  }
  return ok(result.value);
}
