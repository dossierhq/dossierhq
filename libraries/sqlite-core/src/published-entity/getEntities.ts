import type { EntityReference, ErrorType, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabasePublishedEntityGetOnePayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { createSqliteSqlQuery } from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';
import { resolveEntityFields, resolvePublishedEntityInfo } from '../utils/CodecUtils.js';

export async function publishedEntityGetEntities(
  database: Database,
  context: TransactionContext,
  references: EntityReference[],
): PromiseResult<DatabasePublishedEntityGetOnePayload[], typeof ErrorType.Generic> {
  const { addValueList, query, sql } = createSqliteSqlQuery();
  sql`SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.invalid, ev.schema_version, ev.encode_version, ev.fields`;
  sql`FROM entities e, entity_versions ev WHERE e.uuid IN ${addValueList(
    references.map((it) => it.id),
  )}`;
  sql`AND e.published_entity_versions_id = ev.id`;

  const result = await queryMany<
    Pick<
      EntitiesTable,
      'uuid' | 'type' | 'name' | 'auth_key' | 'resolved_auth_key' | 'created_at' | 'invalid'
    > &
      Pick<EntityVersionsTable, 'schema_version' | 'encode_version' | 'fields'>
  >(database, context, query);
  if (result.isError()) return result;

  return ok(
    result.value.map((row) => ({
      ...resolvePublishedEntityInfo(row),
      ...resolveEntityFields(row),
      id: row.uuid,
      resolvedAuthKey: row.resolved_auth_key,
    })),
  );
}
