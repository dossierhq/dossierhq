import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
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
    validateEntityTypes,
    validateValueTypes,
    indexEntityTypes,
    indexValueTypes,
  }: DatabaseManagementMarkEntitiesDirtySelectorArg,
): PromiseResult<DatabaseManagementMarkEntitiesDirtyPayload, typeof ErrorType.Generic> {
  let validationCount = 0;
  let indexCount = 0;

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
