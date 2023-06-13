import type { ErrorType, Location, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import { buildPostgresSqlQuery } from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone } from '../QueryFunctions.js';

export async function updateEntityLatestReferencesLocationsAndValueTypesIndexes(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  entity: DatabaseResolvedEntityReference,
  referenceIds: DatabaseResolvedEntityReference[],
  locations: Location[],
  valueTypes: string[],
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

    const removeExistingValueTypesResult = await queryNone(
      database,
      context,
      buildPostgresSqlQuery(
        ({ sql }) =>
          sql`DELETE FROM entity_latest_value_types WHERE entities_id = ${entity.entityInternalId}`
      )
    );
    if (removeExistingValueTypesResult.isError()) return removeExistingValueTypesResult;
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

  if (valueTypes.length > 0) {
    const insertValueTypesResult = await queryNone(
      database,
      context,
      buildPostgresSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO entity_latest_value_types (entities_id, value_type) VALUES`;
        const entitiesId = addValue(entity.entityInternalId);
        for (const valueType of valueTypes) {
          sql`(${entitiesId}, ${valueType})`;
        }
      })
    );
    if (insertValueTypesResult.isError()) return insertValueTypesResult;
  }

  return ok(undefined);
}
