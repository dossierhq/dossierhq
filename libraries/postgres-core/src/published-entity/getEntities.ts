import type { EntityReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabasePublishedEntityGetOnePayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import { queryMany } from '../QueryFunctions.js';

export async function publishedEntityGetEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  references: EntityReference[]
): PromiseResult<DatabasePublishedEntityGetOnePayload[], typeof ErrorType.Generic> {
  const result = await queryMany<
    Pick<
      EntitiesTable,
      'uuid' | 'type' | 'name' | 'auth_key' | 'resolved_auth_key' | 'created_at'
    > &
      Pick<EntityVersionsTable, 'data'>
  >(databaseAdapter, context, {
    text: `SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = ANY($1)
      AND e.published_entity_versions_id = ev.id`,
    values: [references.map((it) => it.id)],
  });
  if (result.isError()) {
    return result;
  }

  return ok(
    result.value.map((row) => ({
      id: row.uuid,
      type: row.type,
      name: row.name,
      authKey: row.auth_key,
      resolvedAuthKey: row.resolved_auth_key,
      createdAt: row.created_at,
      fieldValues: row.data,
    }))
  );
}
