/* eslint-disable @typescript-eslint/no-unused-expressions */
import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  createPostgresSqlQuery,
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
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryRun } from '../QueryFunctions.js';

const ENTITY_DIRTY_FLAGS_VALIDATE =
  ENTITY_DIRTY_FLAG_VALIDATE_LATEST | ENTITY_DIRTY_FLAG_VALIDATE_PUBLISHED;
const ENTITY_DIRTY_FLAGS_INDEX = ENTITY_DIRTY_FLAG_INDEX_LATEST | ENTITY_DIRTY_FLAG_INDEX_PUBLISHED;

export async function managementDirtyMarkEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  {
    validateEntityTypes,
    validateComponentTypes,
    indexEntityTypes,
    indexComponentTypes,
  }: DatabaseManagementMarkEntitiesDirtySelectorArg,
): PromiseResult<DatabaseManagementMarkEntitiesDirtyPayload, typeof ErrorType.Generic> {
  let validationCount = 0;
  let indexCount = 0;

  if (validateEntityTypes.length > 0) {
    const result = await markEntitiesDirty(
      databaseAdapter,
      context,
      validateEntityTypes,
      ENTITY_DIRTY_FLAGS_VALIDATE,
    );
    if (result.isError()) return result;
    validationCount += result.value;
  }

  if (indexEntityTypes.length > 0) {
    const result = await markEntitiesDirty(
      databaseAdapter,
      context,
      indexEntityTypes,
      ENTITY_DIRTY_FLAGS_INDEX,
    );
    if (result.isError()) return result;
    indexCount += result.value;
  }

  if (validateComponentTypes.length > 0) {
    const result = await markEntitiesWithComponentTypesDirty(
      databaseAdapter,
      context,
      validateComponentTypes,
      ENTITY_DIRTY_FLAGS_VALIDATE,
    );
    if (result.isError()) return result;
    validationCount += result.value;
  }

  if (indexComponentTypes.length > 0) {
    const result = await markEntitiesWithComponentTypesDirty(
      databaseAdapter,
      context,
      indexComponentTypes,
      ENTITY_DIRTY_FLAGS_INDEX,
    );
    if (result.isError()) return result;
    indexCount += result.value;
  }

  return ok({ validationCount, indexCount });
}

async function markEntitiesDirty(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  entityTypes: string[],
  dirtyFlags: number,
) {
  const { sql, query, addValue } = createPostgresSqlQuery();
  const value = addValue(dirtyFlags);
  sql`UPDATE entities SET dirty = dirty | ${value} WHERE type = ANY(${entityTypes}) AND (dirty & ${value}) != ${value}`;

  return await queryRun(databaseAdapter, context, query);
}

async function markEntitiesWithComponentTypesDirty(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  componentTypes: string[],
  dirtyFlags: number,
) {
  const { sql, query, addValue } = createPostgresSqlQuery();
  const dirtyValue = addValue(dirtyFlags);
  sql`UPDATE entities SET dirty = dirty | ${dirtyValue} FROM entity_latest_value_types elvt`;
  sql`WHERE elvt.value_type = ANY(${componentTypes}) AND elvt.entities_id = entities.id AND (entities.dirty & ${dirtyValue}) != ${dirtyValue}`;

  return await queryRun(databaseAdapter, context, query);
}
