import type {
  EntityReference,
  ErrorType,
  PromiseResult,
  UniqueIndexReference,
} from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type {
  DatabasePublishedEntityGetOnePayload,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { createPostgresSqlQuery } from '@jonasb/datadata-database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNoneOrOne } from '../QueryFunctions.js';

export async function publishedEntityGetOne(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: EntityReference | UniqueIndexReference
): PromiseResult<
  DatabasePublishedEntityGetOnePayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const { sql, query } = createPostgresSqlQuery();
  sql`SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, ev.data`;
  if ('id' in reference) {
    sql`FROM entities e, entity_versions ev WHERE e.uuid = ${reference.id}`;
  } else {
    sql`FROM entities e, entity_versions ev, unique_index_values uiv WHERE uiv.index_name = ${reference.index} AND uiv.value = ${reference.value} AND uiv.published AND uiv.entities_id = e.id`;
  }
  sql`AND e.published_entity_versions_id = ev.id`;

  const result = await queryNoneOrOne<
    Pick<
      EntitiesTable,
      'uuid' | 'type' | 'name' | 'auth_key' | 'resolved_auth_key' | 'created_at'
    > &
      Pick<EntityVersionsTable, 'data'>
  >(databaseAdapter, context, query);
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
    data: fieldValues,
  } = result.value;
  return ok({ id, type, name, authKey, resolvedAuthKey, createdAt, fieldValues });
}
