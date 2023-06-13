import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import {
  createPostgresSqlQuery,
  type DatabaseMarkEntitiesForRevalidationPayload,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryRun } from '../QueryFunctions.js';

export async function managementMarkEntitiesForRevalidation(
  databaseAdapter: PostgresDatabaseAdapter,
  context: TransactionContext,
  entityTypes: string[],
  valueTypes: string[]
): PromiseResult<DatabaseMarkEntitiesForRevalidationPayload, typeof ErrorType.Generic> {
  const { sql, query } = createPostgresSqlQuery();
  if (valueTypes.length > 0) {
    //TODO be more specific when we have a value type -> entity index
    sql`UPDATE entities SET dirty = dirty | 1 WHERE dirty & 1 = 0`;
  } else {
    sql`UPDATE entities SET dirty = dirty | 1 WHERE dirty & 1 = 0 AND type = ANY(${entityTypes})`;
  }
  const result = await queryRun(databaseAdapter, context, query);
  if (result.isError()) return result;

  return ok({ count: result.value });
}
