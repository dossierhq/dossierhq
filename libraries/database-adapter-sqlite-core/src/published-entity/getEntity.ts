import type {
  EntityReference,
  ErrorType,
  PromiseResult,
  UniqueIndexReference,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type {
  DatabasePublishedEntityGetOnePayload,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { createSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNoneOrOne } from '../QueryFunctions.js';

export async function publishedEntityGetOne(
  database: Database,
  context: TransactionContext,
  reference: EntityReference | UniqueIndexReference
): PromiseResult<
  DatabasePublishedEntityGetOnePayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const { sql, query } = createSqliteSqlQuery();
  sql`SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, ev.fields`;
  if ('id' in reference) {
    sql`FROM entities e, entity_versions ev WHERE e.uuid = ${reference.id}`;
  } else {
    sql`FROM entities e, entity_versions ev, entity_unique_indexes eui WHERE eui.index_name = ${reference.index} AND eui.value = ${reference.value} AND eui.published AND eui.entities_id = e.id`;
  }
  sql`AND e.published_entity_versions_id = ev.id`;

  const result = await queryNoneOrOne<
    Pick<
      EntitiesTable,
      'uuid' | 'type' | 'name' | 'auth_key' | 'resolved_auth_key' | 'created_at'
    > &
      Pick<EntityVersionsTable, 'fields'>
  >(database, context, query);
  if (result.isError()) return result;
  if (!result.value) {
    return notOk.NotFound('No such entity');
  }
  const {
    uuid: id,
    type,
    name,
    auth_key: authKey,
    resolved_auth_key: resolvedAuthKey,
    created_at: createdAt,
    fields: fieldValues,
  } = result.value;

  return ok({
    id,
    type,
    name,
    authKey,
    resolvedAuthKey,
    createdAt: new Date(createdAt),
    fieldValues: JSON.parse(fieldValues),
  });
}
