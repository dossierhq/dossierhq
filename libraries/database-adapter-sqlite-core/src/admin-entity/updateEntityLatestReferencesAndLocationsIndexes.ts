import type { ErrorType, Location, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { buildSqliteSqlQuery } from '@jonasb/datadata-database-adapter';
import type { Database } from '../QueryFunctions.js';
import { queryRun } from '../QueryFunctions.js';

export async function updateEntityLatestReferencesAndLocationsIndexes(
  database: Database,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  referenceIds: DatabaseResolvedEntityReference[],
  locations: Location[],
  { skipDelete }: { skipDelete: boolean }
): PromiseResult<void, typeof ErrorType.Generic> {
  if (!skipDelete) {
    const removeExistingReferencesResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(
        ({ sql }) =>
          sql`DELETE FROM entity_latest_references WHERE from_entities_id = ${
            entity.entityInternalId as number
          }`
      )
    );
    if (removeExistingReferencesResult.isError()) return removeExistingReferencesResult;

    const removeExistingLocationsResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(
        ({ sql }) =>
          sql`DELETE FROM entity_latest_locations WHERE entities_id = ${
            entity.entityInternalId as number
          }`
      )
    );
    if (removeExistingLocationsResult.isError()) return removeExistingLocationsResult;
  }

  if (referenceIds.length > 0) {
    const insertReferencesResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO entity_latest_references (from_entities_id, to_entities_id) VALUES`;
        const fromEntitiesId = addValue(entity.entityInternalId as number);
        for (const referenceId of referenceIds) {
          sql`(${fromEntitiesId}, ${referenceId.entityInternalId as number})`;
        }
      })
    );
    if (insertReferencesResult.isError()) return insertReferencesResult;
  }

  if (locations.length > 0) {
    const insertLocationsResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO entity_latest_locations (entities_id, lat, lng) VALUES`;
        const entitiesId = addValue(entity.entityInternalId as number);
        for (const location of locations) {
          sql`(${entitiesId}, ${location.lat}, ${location.lng})`;
        }
      })
    );
    if (insertLocationsResult.isError()) return insertLocationsResult;
  }

  return ok(undefined);
}
