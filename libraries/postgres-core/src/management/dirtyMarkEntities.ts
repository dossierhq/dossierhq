import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  createPostgresSqlQuery,
  type DatabaseManagementMarkEntitiesDirtyPayload,
  type DatabaseManagementMarkEntitiesDirtySelectorArg,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryRun } from '../QueryFunctions.js';

export async function managementDirtyMarkEntities(
  databaseAdapter: PostgresDatabaseAdapter,
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
    const result = await markEntitiesDirty(databaseAdapter, context, validateEntityTypes, 1 | 2);
    if (result.isError()) return result;
    validationCount += result.value;
  }

  if (indexEntityTypes.length > 0) {
    const result = await markEntitiesDirty(databaseAdapter, context, indexEntityTypes, 4 | 8);
    if (result.isError()) return result;
    indexCount += result.value;
  }

  if (validateValueTypes.length > 0) {
    const result = await markEntitiesWithValueTypesDirty(
      databaseAdapter,
      context,
      validateValueTypes,
      1 | 2,
    );
    if (result.isError()) return result;
    validationCount += result.value;
  }

  if (indexValueTypes.length > 0) {
    const result = await markEntitiesWithValueTypesDirty(
      databaseAdapter,
      context,
      indexValueTypes,
      4 | 8,
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

async function markEntitiesWithValueTypesDirty(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  valueTypes: string[],
  dirtyFlags: number,
) {
  const { sql, query, addValue } = createPostgresSqlQuery();
  const dirtyValue = addValue(dirtyFlags);
  sql`UPDATE entities SET dirty = dirty | ${dirtyValue} FROM entity_latest_value_types elvt`;
  sql`WHERE elvt.value_type = ANY(${valueTypes}) AND elvt.entities_id = entities.id AND (entities.dirty & ${dirtyValue}) != ${dirtyValue}`;

  return await queryRun(databaseAdapter, context, query);
}
