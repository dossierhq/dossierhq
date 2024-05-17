import { ok, type ArchiveEntitySyncEvent } from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type DatabaseAdapter,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { queryRun, type Database } from '../QueryFunctions.js';
import { getTransactionTimestamp } from '../SqliteTransaction.js';

export async function adminEntityDeleteEntity(
  database: Database,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference,
  syncEvent: ArchiveEntitySyncEvent | null,
): ReturnType<DatabaseAdapter['adminEntityDeleteEntity']> {
  const now = syncEvent?.createdAt ?? getTransactionTimestamp(context.transaction);
  const entityId = reference.entityInternalId as number;

  const entityResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      sql`UPDATE entities
          SET uuid_before_delete = uuid, uuid = NULL, deleted_at = ${now.toISOString()}, status = 'deleted'
          WHERE id = ${entityId}`;
    }),
  );
  if (entityResult.isError()) return entityResult;

  // Update indexes

  const deleteFtsResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql }) => sql`DELETE FROM entities_latest_fts WHERE rowid = ${entityId}`,
    ),
  );
  if (deleteFtsResult.isError()) return deleteFtsResult;

  const removeExistingReferencesResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql }) => sql`DELETE FROM entity_latest_references WHERE from_entities_id = ${entityId}`,
    ),
  );
  if (removeExistingReferencesResult.isError()) return removeExistingReferencesResult;

  const removeExistingLocationsResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql }) => sql`DELETE FROM entity_latest_locations WHERE entities_id = ${entityId}`,
    ),
  );
  if (removeExistingLocationsResult.isError()) return removeExistingLocationsResult;

  const removeExistingValueTypesResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql }) => sql`DELETE FROM entity_latest_value_types WHERE entities_id = ${entityId}`,
    ),
  );
  if (removeExistingValueTypesResult.isError()) return removeExistingValueTypesResult;

  const removeUniqueValuesResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql }) => sql`DELETE FROM unique_index_values WHERE entities_id = ${entityId}`,
    ),
  );
  if (removeUniqueValuesResult.isError()) return removeUniqueValuesResult;

  return ok({ deletedAt: now });
}
