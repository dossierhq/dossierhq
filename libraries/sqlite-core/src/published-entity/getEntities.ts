import { ok, type EntityReference, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  createSqliteSqlQuery,
  type DatabasePublishedEntityGetOnePayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import { queryMany, type Database } from '../QueryFunctions.js';
import { resolveEntityFields, resolvePublishedEntityInfo } from '../utils/CodecUtils.js';

type Row = Pick<
  EntitiesTable,
  'uuid' | 'type' | 'published_name' | 'auth_key' | 'resolved_auth_key' | 'created_at' | 'invalid'
> &
  Pick<EntityVersionsTable, 'schema_version' | 'encode_version' | 'fields'>;

export async function publishedEntityGetEntities(
  database: Database,
  context: TransactionContext,
  references: EntityReference[],
): PromiseResult<DatabasePublishedEntityGetOnePayload[], typeof ErrorType.Generic> {
  const { addValueList, query, sql } = createSqliteSqlQuery();
  sql`SELECT e.uuid, e.type, e.published_name, e.auth_key, e.resolved_auth_key, e.created_at, e.invalid, ev.schema_version, ev.encode_version, ev.fields`;
  sql`FROM entities e, entity_versions ev WHERE e.uuid IN ${addValueList(
    references.map((it) => it.id),
  )}`;
  sql`AND e.published_entity_versions_id = ev.id`;

  const result = await queryMany<Row>(database, context, query);
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
