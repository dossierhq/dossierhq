/* eslint-disable @typescript-eslint/no-unused-expressions */
import { ok, type DeleteEntitiesSyncEvent } from '@dossierhq/core';
import {
  buildPostgresSqlQuery,
  type DatabaseAdapter,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { EntitiesTable } from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryMany, queryRun } from '../QueryFunctions.js';
import { assertIsDefined } from '../utils/AssertUtils.js';

export async function adminEntityDeleteEntities(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  references: DatabaseResolvedEntityReference[],
  syncEvent: DeleteEntitiesSyncEvent | null,
): ReturnType<DatabaseAdapter['adminEntityDeleteEntities']> {
  const entityIds = references.map((it) => it.entityInternalId as number);

  const entityResult = await queryMany<Pick<EntitiesTable, 'deleted_at'>>(
    database,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      sql`UPDATE entities`;
      sql`SET uuid_before_delete = uuid, uuid = NULL, name_before_delete = name, name = NULL, latest_fts = NULL, status = 'deleted'`;
      if (syncEvent) {
        sql`, deleted_at = ${syncEvent.createdAt}`;
      } else {
        sql`, deleted_at = NOW()`;
      }
      sql`WHERE id = ANY(${entityIds}) RETURNING deleted_at`;
    }),
  );
  if (entityResult.isError()) return entityResult;
  const deletedAt = entityResult.value[0].deleted_at;
  assertIsDefined(deletedAt);

  // Update indexes

  const removeExistingReferencesResult = await queryRun(
    database,
    context,
    buildPostgresSqlQuery(
      ({ sql }) =>
        sql`DELETE FROM entity_latest_references WHERE from_entities_id = ANY(${entityIds})`,
    ),
  );
  if (removeExistingReferencesResult.isError()) return removeExistingReferencesResult;

  const removeExistingLocationsResult = await queryRun(
    database,
    context,
    buildPostgresSqlQuery(
      ({ sql }) => sql`DELETE FROM entity_latest_locations WHERE entities_id = ANY(${entityIds})`,
    ),
  );
  if (removeExistingLocationsResult.isError()) return removeExistingLocationsResult;

  const removeExistingValueTypesResult = await queryRun(
    database,
    context,
    buildPostgresSqlQuery(
      ({ sql }) => sql`DELETE FROM entity_latest_value_types WHERE entities_id = ANY(${entityIds})`,
    ),
  );
  if (removeExistingValueTypesResult.isError()) return removeExistingValueTypesResult;

  const removeUniqueValuesResult = await queryRun(
    database,
    context,
    buildPostgresSqlQuery(
      ({ sql }) => sql`DELETE FROM unique_index_values WHERE entities_id = ANY(${entityIds})`,
    ),
  );
  if (removeUniqueValuesResult.isError()) return removeUniqueValuesResult;

  return ok({ deletedAt });
}
