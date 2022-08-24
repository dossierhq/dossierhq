import type { ErrorType, Location, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { buildPostgresSqlQuery } from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone } from '../QueryFunctions.js';

export async function updateEntityLatestReferencesAndLocationsIndexes(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  referenceIds: DatabaseResolvedEntityReference[],
  locations: Location[],
  { skipDelete }: { skipDelete: boolean }
): PromiseResult<void, typeof ErrorType.Generic> {
  if (!skipDelete) {
    const removeExistingReferencesResult = await queryNone(
      database,
      context,
      buildPostgresSqlQuery(
        ({ sql }) =>
          sql`DELETE FROM entity_latest_references WHERE from_entities_id = ${entity.entityInternalId}`
      )
    );
    if (removeExistingReferencesResult.isError()) return removeExistingReferencesResult;

    const removeExistingLocationsResult = await queryNone(
      database,
      context,
      buildPostgresSqlQuery(
        ({ sql }) =>
          sql`DELETE FROM entity_latest_locations WHERE entities_id = ${entity.entityInternalId}`
      )
    );
    if (removeExistingLocationsResult.isError()) return removeExistingLocationsResult;
  }

  if (referenceIds.length > 0) {
    const insertReferencesResult = await queryNone(
      database,
      context,
      buildPostgresSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO entity_latest_references (from_entities_id, to_entities_id) VALUES`;
        const fromEntitiesId = addValue(entity.entityInternalId);
        for (const referenceId of referenceIds) {
          sql`(${fromEntitiesId}, ${referenceId.entityInternalId})`;
        }
      })
    );
    if (insertReferencesResult.isError()) return insertReferencesResult;
  }

  if (locations.length > 0) {
    const insertLocationsResult = await queryNone(
      database,
      context,
      buildPostgresSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO entity_latest_locations (entities_id, location) VALUES`;
        const entitiesId = addValue(entity.entityInternalId);
        for (const location of locations) {
          sql`(${entitiesId}, ST_SetSRID(ST_Point(${location.lng}, ${location.lat}), 4326))`;
        }
      })
    );
    if (insertLocationsResult.isError()) return insertLocationsResult;
  }

  return ok(undefined);
}
