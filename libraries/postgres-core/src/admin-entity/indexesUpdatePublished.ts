import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  buildPostgresSqlQuery,
  type DatabaseEntityIndexesArg,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryNone } from '../QueryFunctions.js';

export async function adminEntityIndexesUpdatePublished(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference,
  entityIndexes: DatabaseEntityIndexesArg,
): PromiseResult<void, typeof ErrorType.Generic> {
  const entityId = reference.entityInternalId;
  const { fullTextSearchText, referenceIds, locations, valueTypes } = entityIndexes;

  // FTS
  const ftsResult = await queryNone(
    database,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      sql`UPDATE entities SET published_fts = to_tsvector(${fullTextSearchText}) WHERE id = ${entityId}`;
    }),
  );
  if (ftsResult.isError()) return ftsResult;

  // Remove existing indexes
  const removeExistingReferencesResult = await queryNone(
    database,
    context,
    buildPostgresSqlQuery(
      ({ sql }) =>
        sql`DELETE FROM entity_published_references WHERE from_entities_id = ${entityId}`,
    ),
  );
  if (removeExistingReferencesResult.isError()) return removeExistingReferencesResult;

  const removeExistingLocationsResult = await queryNone(
    database,
    context,
    buildPostgresSqlQuery(
      ({ sql }) => sql`DELETE FROM entity_published_locations WHERE entities_id = ${entityId}`,
    ),
  );
  if (removeExistingLocationsResult.isError()) return removeExistingLocationsResult;

  const removeExistingValueTypesResult = await queryNone(
    database,
    context,
    buildPostgresSqlQuery(
      ({ sql }) => sql`DELETE FROM entity_published_value_types WHERE entities_id = ${entityId}`,
    ),
  );
  if (removeExistingValueTypesResult.isError()) return removeExistingValueTypesResult;

  // Update indexes

  if (referenceIds.length > 0) {
    const insertReferencesResult = await queryNone(
      database,
      context,
      buildPostgresSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO entity_published_references (from_entities_id, to_entities_id) VALUES`;
        const fromEntitiesId = addValue(entityId);
        for (const referenceId of referenceIds) {
          sql`, (${fromEntitiesId}, ${referenceId.entityInternalId})`;
        }
      }),
    );
    if (insertReferencesResult.isError()) return insertReferencesResult;
  }

  if (locations.length > 0) {
    const insertLocationsResult = await queryNone(
      database,
      context,
      buildPostgresSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO entity_published_locations (entities_id, location) VALUES`;
        const entitiesId = addValue(entityId);
        for (const location of locations) {
          sql`, (${entitiesId}, ST_SetSRID(ST_Point(${location.lng}, ${location.lat}), 4326))`;
        }
      }),
    );
    if (insertLocationsResult.isError()) return insertLocationsResult;
  }

  if (valueTypes.length > 0) {
    const insertValueTypesResult = await queryNone(
      database,
      context,
      buildPostgresSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO entity_published_value_types (entities_id, value_type) VALUES`;
        const entitiesId = addValue(entityId);
        for (const valueType of valueTypes) {
          sql`, (${entitiesId}, ${valueType})`;
        }
      }),
    );
    if (insertValueTypesResult.isError()) return insertValueTypesResult;
  }

  return ok(undefined);
}
