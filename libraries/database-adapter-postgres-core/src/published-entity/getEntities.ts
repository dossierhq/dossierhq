import type { EntityReference, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabasePublishedEntityGetOnePayload,
  TransactionContext,
} from '@jonasb/datadata-server';
import type { PostgresDatabaseAdapter } from '..';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema';
import { queryMany } from '../QueryFunctions';

export async function publishedEntityGetEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  references: EntityReference[]
): PromiseResult<DatabasePublishedEntityGetOnePayload[], ErrorType.Generic> {
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
