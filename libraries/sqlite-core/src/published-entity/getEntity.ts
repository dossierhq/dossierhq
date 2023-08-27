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
} from '@dossierhq/database-adapter';
import { createSqliteSqlQuery } from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryNoneOrOne } from '../QueryFunctions.js';
import { resolveEntityFields, resolvePublishedEntityInfo } from '../utils/CodecUtils.js';

type Row = Pick<
  EntitiesTable,
  'uuid' | 'type' | 'published_name' | 'auth_key' | 'resolved_auth_key' | 'created_at' | 'invalid'
> &
  Pick<EntityVersionsTable, 'schema_version' | 'encode_version' | 'fields'>;

export async function publishedEntityGetOne(
  database: Database,
  context: TransactionContext,
  reference: EntityReference | UniqueIndexReference,
): PromiseResult<
  DatabasePublishedEntityGetOnePayload,
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const { sql, query } = createSqliteSqlQuery();
  sql`SELECT e.uuid, e.type, e.published_name, e.auth_key, e.resolved_auth_key, e.created_at, e.invalid, ev.schema_version, ev.encode_version, ev.fields`;
  if ('id' in reference) {
    sql`FROM entities e, entity_versions ev WHERE e.uuid = ${reference.id}`;
  } else {
    sql`FROM entities e, entity_versions ev, unique_index_values uiv WHERE uiv.index_name = ${reference.index} AND uiv.value = ${reference.value} AND uiv.published AND uiv.entities_id = e.id`;
  }
  sql`AND e.published_entity_versions_id = ev.id`;

  const result = await queryNoneOrOne<Row>(database, context, query);
  if (result.isError()) return result;
  if (!result.value) {
    return notOk.NotFound('No such entity');
  }
  const { uuid: id, resolved_auth_key: resolvedAuthKey } = result.value;

  return ok({
    ...resolvePublishedEntityInfo(result.value),
    ...resolveEntityFields(result.value),
    id,
    resolvedAuthKey,
  });
}
