import { ok, ErrorType, type PromiseResult, notOk } from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  type DatabaseEntityIndexesArg,
  type DatabaseResolvedEntityReference,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import { queryRun, type Database } from '../QueryFunctions.js';

export async function adminEntityIndexesUpdatePublished(
  database: Database,
  context: TransactionContext,
  reference: DatabaseResolvedEntityReference,
  entityIndexes: DatabaseEntityIndexesArg,
): PromiseResult<void, typeof ErrorType.Generic> {
  const entityId = reference.entityInternalId as number;
  const { fullTextSearchText, referenceIds, locations, valueTypes } = entityIndexes;

  // FTS virtual tables don't support upsert
  // FTS upsert 1/2) Try to insert
  const ftsInsertResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql }) =>
        sql`INSERT INTO entities_published_fts (rowid, content)
          VALUES (${entityId}, ${fullTextSearchText})`,
    ),
    (error) => {
      if (database.adapter.isFtsVirtualTableConstraintFailed(error)) {
        return notOk.Conflict('Document already exists');
      }
      return notOk.GenericUnexpectedException(context, error);
    },
  );

  // FTS upsert 2/2) Update when insert failed
  if (ftsInsertResult.isError()) {
    if (ftsInsertResult.isErrorType(ErrorType.Generic)) return ftsInsertResult;

    const ftsUpdateResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(
        ({ sql }) =>
          sql`UPDATE entities_published_fts
            SET content = ${fullTextSearchText}
            WHERE rowid = ${entityId}`,
      ),
    );
    if (ftsUpdateResult.isError()) return ftsUpdateResult;
  }

  // Remove existing indexes
  const removeExistingReferencesResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql }) =>
        sql`DELETE FROM entity_published_references WHERE from_entities_id = ${entityId}`,
    ),
  );
  if (removeExistingReferencesResult.isError()) return removeExistingReferencesResult;

  const removeExistingLocationsResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql }) => sql`DELETE FROM entity_published_locations WHERE entities_id = ${entityId}`,
    ),
  );
  if (removeExistingLocationsResult.isError()) return removeExistingLocationsResult;

  const removeExistingValueTypesResult = await queryRun(
    database,
    context,
    buildSqliteSqlQuery(
      ({ sql }) => sql`DELETE FROM entity_published_value_types WHERE entities_id = ${entityId}`,
    ),
  );
  if (removeExistingValueTypesResult.isError()) return removeExistingValueTypesResult;

  // Update indexes

  if (referenceIds.length > 0) {
    const insertReferencesResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO entity_published_references (from_entities_id, to_entities_id) VALUES`;
        const fromEntitiesId = addValue(entityId);
        for (const referenceId of referenceIds) {
          sql`(${fromEntitiesId}, ${referenceId.entityInternalId as number})`;
        }
      }),
    );
    if (insertReferencesResult.isError()) return insertReferencesResult;
  }

  if (locations.length > 0) {
    const insertLocationsResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO entity_published_locations (entities_id, lat, lng) VALUES`;
        const entitiesId = addValue(entityId);
        for (const location of locations) {
          sql`(${entitiesId}, ${location.lat}, ${location.lng})`;
        }
      }),
    );
    if (insertLocationsResult.isError()) return insertLocationsResult;
  }

  if (valueTypes.length > 0) {
    const insertValueTypesResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql, addValue }) => {
        sql`INSERT INTO entity_published_value_types (entities_id, value_type) VALUES`;
        const entitiesId = addValue(entityId);
        for (const valueType of valueTypes) {
          sql`(${entitiesId}, ${valueType})`;
        }
      }),
    );
    if (insertValueTypesResult.isError()) return insertValueTypesResult;
  }

  return ok(undefined);
}
