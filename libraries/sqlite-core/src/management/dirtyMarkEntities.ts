import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  buildSqliteSqlQuery,
  createSqliteSqlQuery,
  type DatabaseManagementMarkEntitiesDirtyPayload,
  type DatabaseManagementMarkEntitiesDirtySelectorArg,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import {
  ENTITY_DIRTY_FLAG_INDEX_LATEST,
  ENTITY_DIRTY_FLAG_INDEX_PUBLISHED,
  ENTITY_DIRTY_FLAG_VALIDATE_LATEST,
  ENTITY_DIRTY_FLAG_VALIDATE_PUBLISHED,
} from '../DatabaseSchema.js';
import { queryRun, type Database } from '../QueryFunctions.js';

const ENTITY_DIRTY_FLAGS_VALIDATE =
  ENTITY_DIRTY_FLAG_VALIDATE_LATEST | ENTITY_DIRTY_FLAG_VALIDATE_PUBLISHED;
const ENTITY_DIRTY_FLAGS_INDEX = ENTITY_DIRTY_FLAG_INDEX_LATEST | ENTITY_DIRTY_FLAG_INDEX_PUBLISHED;

export async function managementDirtyMarkEntities(
  database: Database,
  context: TransactionContext,
  {
    renameValueTypes,
    validateEntityTypes,
    validateValueTypes,
    indexEntityTypes,
    indexValueTypes,
    deleteValueTypes,
  }: DatabaseManagementMarkEntitiesDirtySelectorArg,
): PromiseResult<DatabaseManagementMarkEntitiesDirtyPayload, typeof ErrorType.Generic> {
  let validationCount = 0;
  let indexCount = 0;

  // Apply the rename first, since the value types operations will use the new names
  for (const [oldName, newName] of Object.entries(renameValueTypes)) {
    const latestResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql }) => {
        sql`UPDATE entity_latest_value_types SET value_type = ${newName} WHERE value_type = ${oldName}`;
      }),
    );
    if (latestResult.isError()) return latestResult;

    const publishedResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql }) => {
        sql`UPDATE entity_published_value_types SET value_type = ${newName} WHERE value_type = ${oldName}`;
      }),
    );
    if (publishedResult.isError()) return publishedResult;
  }

  if (validateEntityTypes.length > 0) {
    const result = await markEntitiesDirty(
      database,
      context,
      validateEntityTypes,
      ENTITY_DIRTY_FLAGS_VALIDATE,
    );
    if (result.isError()) return result;
    validationCount += result.value;
  }

  if (indexEntityTypes.length > 0) {
    const result = await markEntitiesDirty(
      database,
      context,
      indexEntityTypes,
      ENTITY_DIRTY_FLAGS_INDEX,
    );
    if (result.isError()) return result;
    indexCount += result.value;
  }

  if (validateValueTypes.length > 0) {
    const result = await markEntitiesWithValueTypesDirty(
      database,
      context,
      validateValueTypes,
      ENTITY_DIRTY_FLAGS_VALIDATE,
    );
    if (result.isError()) return result;
    validationCount += result.value;
  }

  if (indexValueTypes.length > 0) {
    const result = await markEntitiesWithValueTypesDirty(
      database,
      context,
      indexValueTypes,
      ENTITY_DIRTY_FLAGS_INDEX,
    );
    if (result.isError()) return result;
    indexCount += result.value;
  }

  // Apply the delete last, since we want to index/validate entities using the value types
  if (deleteValueTypes.length > 0) {
    const latestResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql, addValueList }) => {
        sql`DELETE FROM entity_latest_value_types WHERE value_type IN ${addValueList(
          deleteValueTypes,
        )}`;
      }),
    );
    if (latestResult.isError()) return latestResult;

    const publishedResult = await queryRun(
      database,
      context,
      buildSqliteSqlQuery(({ sql, addValueList }) => {
        sql`DELETE FROM entity_published_value_types WHERE value_type IN ${addValueList(
          deleteValueTypes,
        )}`;
      }),
    );
    if (publishedResult.isError()) return publishedResult;
  }

  return ok({ validationCount, indexCount });
}

async function markEntitiesDirty(
  database: Database,
  context: TransactionContext,
  entityTypes: string[],
  dirtyFlags: number,
) {
  const { sql, query, addValue, addValueList } = createSqliteSqlQuery();
  const dirtyValue = addValue(dirtyFlags);
  sql`UPDATE entities SET dirty = dirty | ${dirtyValue}`;
  sql`WHERE type IN ${addValueList(entityTypes)} AND (dirty & ${dirtyValue}) != ${dirtyValue}`;

  return await queryRun(database, context, query);
}

async function markEntitiesWithValueTypesDirty(
  database: Database,
  context: TransactionContext,
  valueTypes: string[],
  dirtyFlags: number,
) {
  const { sql, query, addValue, addValueList } = createSqliteSqlQuery();
  const dirtyValue = addValue(dirtyFlags);
  sql`UPDATE entities SET dirty = dirty | ${dirtyValue} FROM entity_latest_value_types elvt`;
  sql`WHERE elvt.value_type IN ${addValueList(valueTypes)}`;
  sql`AND elvt.entities_id = entities.id AND (entities.dirty & ${dirtyValue}) != ${dirtyValue}`;

  return await queryRun(database, context, query);
}
