import {
  notOk,
  ok,
  type EntityReference,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type DatabaseAdminEntityDeleteGetInfoPayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable } from '../DatabaseSchema.js';
import { queryMany, type Database } from '../QueryFunctions.js';

export async function adminEntityDeleteGetEntityInfo(
  database: Database,
  context: TransactionContext,
  references: EntityReference[],
): PromiseResult<
  DatabaseAdminEntityDeleteGetInfoPayload[],
  typeof ErrorType.NotFound | typeof ErrorType.Generic
> {
  const uuids = references.map(({ id }) => id);
  type Row = Pick<
    EntitiesTable,
    'id' | 'uuid' | 'auth_key' | 'resolved_auth_key' | 'status' | 'latest_entity_versions_id'
  >;
  const result = await queryMany<Row>(
    database,
    context,
    buildSqliteSqlQuery(({ sql, addValueList }) => {
      sql`SELECT e.id, e.uuid, e.auth_key, e.resolved_auth_key, e.status, e.latest_entity_versions_id
        FROM entities e
        WHERE e.uuid IN ${addValueList(uuids)}`;
    }),
  );
  if (result.isError()) return result;

  const missingUuids: string[] = [];
  const payload: DatabaseAdminEntityDeleteGetInfoPayload[] = [];
  for (const uuid of uuids) {
    const row = result.value.find((row) => row.uuid === uuid);
    if (!row) {
      missingUuids.push(uuid);
    } else {
      payload.push({
        entityId: uuid,
        entityInternalId: row.id,
        entityVersionInternalId: row.latest_entity_versions_id,
        authKey: row.auth_key,
        resolvedAuthKey: row.resolved_auth_key,
        status: row.status,
      });
    }
  }

  if (missingUuids.length > 0) {
    return notOk.NotFound(`No such entities: ${missingUuids.join(', ')}`);
  }

  return ok(payload);
}
