import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type DatabaseEntityIndexesArg,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { queryRun, type Database } from '../QueryFunctions.js';

export async function updateLatestEntityIndexes(
  database: Database,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference,
  entityIndexes: DatabaseEntityIndexesArg,
  { skipDelete }: { skipDelete: boolean }
): PromiseResult<void, typeof ErrorType.Generic> {
  const entityId = reference.entityInternalId as number;
  const { fullTextSearchText, referenceIds, locations, valueTypes } = entityIndexes;

  // FTS
  const ftsResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(({ sql }) => {
      if (skipDelete) {
        sql`INSERT INTO entities_latest_fts (rowid, content) VALUES (${entityId}, ${fullTextSearchText})`;
      } else {
        sql`UPDATE entities_latest_fts SET content = ${fullTextSearchText} WHERE rowid = ${entityId}`;
      }
    })
  );
  if (ftsResult.isError()) return ftsResult;

  // Remove existing indexes
  if (!skipDelete) {
    const removeExistingReferencesResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(
        ({ sql }) => sql`DELETE FROM entity_latest_references WHERE from_entities_id = ${entityId}`
      )
    );
    if (removeExistingReferencesResult.isError()) return removeExistingReferencesResult;

    const removeExistingLocationsResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(
        ({ sql }) => sql`DELETE FROM entity_latest_locations WHERE entities_id = ${entityId}`
      )
    );
    if (removeExistingLocationsResult.isError()) return removeExistingLocationsResult;

    const removeExistingValueTypesResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(
        ({ sql }) => sql`DELETE FROM entity_latest_value_types WHERE entities_id = ${entityId}`
      )
    );
    if (removeExistingValueTypesResult.isError()) return removeExistingValueTypesResult;
  }

  // Update indexes

  if (referenceIds.length > 0) {
    const insertReferencesResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO entity_latest_references (from_entities_id, to_entities_id) VALUES`;
        const fromEntitiesId = addValue(entityId);
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
        const entitiesId = addValue(entityId);
        for (const location of locations) {
          sql`(${entitiesId}, ${location.lat}, ${location.lng})`;
        }
      })
    );
    if (insertLocationsResult.isError()) return insertLocationsResult;
  }

  if (valueTypes.length > 0) {
    const insertValueTypesResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO entity_latest_value_types (entities_id, value_type) VALUES`;
        const entitiesId = addValue(entityId);
        for (const valueType of valueTypes) {
          sql`(${entitiesId}, ${valueType})`;
        }
      })
    );
    if (insertValueTypesResult.isError()) return insertValueTypesResult;
  }

  return ok(undefined);
}
