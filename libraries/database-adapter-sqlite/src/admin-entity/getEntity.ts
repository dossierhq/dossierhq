import type {
  EntityReference,
  EntityVersionReference,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntityGetOnePayload,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { createSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { SqliteDatabaseAdapter } from '..';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema';
import { queryNoneOrOne } from '../QueryFunctions';
import { resolveEntityStatus } from '../utils/CodecUtils';

export async function adminGetEntity(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference | EntityVersionReference
): PromiseResult<DatabaseAdminEntityGetOnePayload, ErrorType.NotFound | ErrorType.Generic> {
  const result =
    'version' in reference
      ? await getEntityWithVersion(databaseAdapter, context, reference)
      : await getEntityWithLatestVersion(databaseAdapter, context, reference);
  if (result.isError()) {
    return result;
  }

  const {
    uuid: id,
    type,
    name,
    version,
    auth_key: authKey,
    resolved_auth_key: resolvedAuthKey,
    status,
    created_at: createdAt,
    updated_at: updatedAt,
    fields: fieldValues,
  } = result.value;

  return ok({
    id,
    type,
    name,
    version,
    authKey,
    resolvedAuthKey,
    status: resolveEntityStatus(status),
    createdAt: Temporal.Instant.from(createdAt),
    updatedAt: Temporal.Instant.from(updatedAt),
    fieldValues: JSON.parse(fieldValues),
  });
}

async function getEntityWithLatestVersion(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference
) {
  const { sql, query } = createSqliteSqlQuery();
  sql`SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
      FROM entities e, entity_versions ev
      WHERE e.uuid = ${reference.id} AND e.latest_entity_versions_id = ev.id`;

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
    > &
      Pick<EntityVersionsTable, 'version' | 'fields'>
  >(databaseAdapter, context, query);
  if (result.isError()) {
    return result;
  }
  if (!result.value) {
    return notOk.NotFound('No such entity');
  }
  return ok(result.value);
}

async function getEntityWithVersion(
  databaseAdapter: SqliteDatabaseAdapter,
  context: TransactionContext,
  reference: EntityVersionReference
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
    > &
      Pick<EntityVersionsTable, 'version' | 'fields'>
  >(databaseAdapter, context, {
    text: `SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
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
