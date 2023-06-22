import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  createPostgresSqlQuery,
  type DatabaseManagementMarkEntitiesDirtyPayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryRun } from '../QueryFunctions.js';

export async function managementDirtyMarkEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  entityTypes: string[],
  valueTypes: string[]
): PromiseResult<DatabaseManagementMarkEntitiesDirtyPayload, typeof ErrorType.Generic> {
  let count = 0;

  //TODO support marking for indexing

  if (entityTypes.length > 0) {
    const { sql, query } = createPostgresSqlQuery();

    sql`UPDATE entities SET dirty = dirty | 1|2 WHERE type = ANY(${entityTypes}) AND (dirty & (1|2)) != (1|2)`;

    const result = await queryRun(databaseAdapter, context, query);
    if (result.isError()) return result;
    count += result.value;
  }

  if (valueTypes.length > 0) {
    const { sql, query } = createPostgresSqlQuery();

    sql`UPDATE entities SET dirty = dirty | 1|2 FROM entity_latest_value_types elvt
    WHERE elvt.value_type = ANY(${valueTypes}) AND elvt.entities_id = entities.id AND (entities.dirty & (1|2)) != (1|2)`;

    const result = await queryRun(databaseAdapter, context, query);
    if (result.isError()) return result;
    count += result.value;
  }

  return ok({ count });
}
