import { ok, type EntityReference, type ErrorType, type PromiseResult } from '@dossierhq/core';
import type {
  DatabasePublishedEntityGetOnePayload,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryMany } from '../QueryFunctions.js';
import { resolveEntityFields, resolvePublishedEntityInfo } from '../utils/CodecUtils.js';

type Row = Pick<
  EntitiesTable,
  'uuid' | 'type' | 'published_name' | 'auth_key' | 'resolved_auth_key' | 'created_at' | 'invalid'
> &
  Pick<EntityVersionsTable, 'schema_version' | 'encode_version' | 'data'>;

export async function publishedEntityGetEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  references: EntityReference[],
): PromiseResult<DatabasePublishedEntityGetOnePayload[], typeof ErrorType.Generic> {
  const result = await queryMany<Row>(databaseAdapter, context, {
    text: `SELECT e.uuid, e.type, e.published_name, e.auth_key, e.resolved_auth_key, e.created_at, e.invalid, ev.schema_version, ev.encode_version, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = ANY($1)
      AND e.published_entity_versions_id = ev.id`,
    values: [references.map((it) => it.id)],
  });
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
