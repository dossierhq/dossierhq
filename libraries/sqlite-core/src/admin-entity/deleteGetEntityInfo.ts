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
import type { EntitiesTable, EntityLatestReferencesTable } from '../DatabaseSchema.js';
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

  type EntityRow = Pick<
    EntitiesTable,
    'id' | 'uuid' | 'auth_key' | 'resolved_auth_key' | 'status' | 'latest_entity_versions_id'
  >;
  const entityResult = await queryMany<EntityRow>(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql, addValueList }) =>
        sql`SELECT e.id, e.uuid, e.auth_key, e.resolved_auth_key, e.status, e.latest_entity_versions_id
            FROM entities e
            WHERE e.uuid IN ${addValueList(uuids)}`,
    ),
  );
  if (entityResult.isError()) return entityResult;

  const missingUuids: string[] = [];
  const payload: DatabaseAdminEntityDeleteGetInfoPayload[] = [];
  for (const uuid of uuids) {
    const row = entityResult.value.find((row) => row.uuid === uuid);
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
        referencedBy: [],
      });
    }
  }

  if (missingUuids.length > 0) {
    return notOk.NotFound(`No such entities: ${missingUuids.join(', ')}`);
  }

  // Check if it's referenced by other entities (latest)

  type LatestReferenceRow = Pick<EntityLatestReferencesTable, 'to_entities_id'> &
    Pick<EntitiesTable, 'uuid'>;
  const latestReferencesResult = await queryMany<LatestReferenceRow>(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql, addValueList }) =>
        sql`SELECT elr.to_entities_id, e.uuid
            FROM entity_latest_references elr
            JOIN entities e ON elr.from_entities_id = e.id
            WHERE elr.to_entities_id IN ${addValueList(payload.map((it) => it.entityInternalId as number))}`,
    ),
  );
  if (latestReferencesResult.isError()) return latestReferencesResult;

  for (const row of latestReferencesResult.value) {
    const entity = payload.find((it) => it.entityInternalId === row.to_entities_id);
    if (entity && row.uuid) {
      entity.referencedBy.push({ id: row.uuid });
    }
  }

  return ok(payload);
}
