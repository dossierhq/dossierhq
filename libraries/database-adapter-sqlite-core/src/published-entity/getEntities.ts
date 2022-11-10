import type { EntityReference, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabasePublishedEntityGetOnePayload,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { createSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';

export async function publishedEntityGetEntities(
  database: Database,
  context: TransactionContext,
  references: EntityReference[]
): PromiseResult<DatabasePublishedEntityGetOnePayload[], typeof ErrorType.Generic> {
  const { addValueList, query, sql } = createSqliteSqlQuery();
  sql`SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, ev.fields`;
  sql`FROM entities e, entity_versions ev WHERE e.uuid IN ${addValueList(
    references.map((it) => it.id)
  )}`;
  sql`AND e.published_entity_versions_id = ev.id`;

  const result = await queryMany<
    Pick<
      EntitiesTable,
      'uuid' | 'type' | 'name' | 'auth_key' | 'resolved_auth_key' | 'created_at'
    > &
      Pick<EntityVersionsTable, 'fields'>
  >(database, context, query);
  if (result.isError()) return result;

  return ok(
    result.value.map((row) => ({
      id: row.uuid,
      type: row.type,
      name: row.name,
      authKey: row.auth_key,
      resolvedAuthKey: row.resolved_auth_key,
      createdAt: new Date(row.created_at),
      fieldValues: JSON.parse(row.fields),
    }))
  );
}
