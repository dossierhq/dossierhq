import { ok, type DeleteEntitiesSyncEvent } from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type DatabaseAdapter,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { queryRun, type Database } from '../QueryFunctions.js';
import { getTransactionTimestamp } from '../SqliteTransaction.js';

export async function adminEntityDeleteEntities(
  database: Database,
  context: TransactionContext,
  references: DatabaseResolvedEntityReference[],
  syncEvent: DeleteEntitiesSyncEvent | null,
): ReturnType<DatabaseAdapter['adminEntityDeleteEntities']> {
  const now = syncEvent?.createdAt ?? getTransactionTimestamp(context.transaction);
  const entityIds = references.map((it) => it.entityInternalId as number);

  const entityResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql, addValueList }) => {
      sql`UPDATE entities
          SET uuid_before_delete = uuid, uuid = NULL, name_before_delete = name, name = NULL, deleted_at = ${now.toISOString()}, status = 'deleted'
          WHERE id IN ${addValueList(entityIds)}`;
    }),
  );
  if (entityResult.isError()) return entityResult;

  // Update indexes

  const deleteFtsResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql, addValueList }) =>
        sql`DELETE FROM entities_latest_fts WHERE rowid IN ${addValueList(entityIds)}`,
    ),
  );
  if (deleteFtsResult.isError()) return deleteFtsResult;

  const removeExistingReferencesResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql, addValueList }) =>
        sql`DELETE FROM entity_latest_references WHERE from_entities_id IN ${addValueList(entityIds)}`,
    ),
  );
  if (removeExistingReferencesResult.isError()) return removeExistingReferencesResult;

  const removeExistingLocationsResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql, addValueList }) =>
        sql`DELETE FROM entity_latest_locations WHERE entities_id IN ${addValueList(entityIds)}`,
    ),
  );
  if (removeExistingLocationsResult.isError()) return removeExistingLocationsResult;

  const removeExistingValueTypesResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql, addValueList }) =>
        sql`DELETE FROM entity_latest_value_types WHERE entities_id IN ${addValueList(entityIds)}`,
    ),
  );
  if (removeExistingValueTypesResult.isError()) return removeExistingValueTypesResult;

  const removeUniqueValuesResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql, addValueList }) =>
        sql`DELETE FROM unique_index_values WHERE entities_id IN ${addValueList(entityIds)}`,
    ),
  );
  if (removeUniqueValuesResult.isError()) return removeUniqueValuesResult;

  return ok({ deletedAt: now });
}
