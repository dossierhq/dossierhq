import {
  ok,
  type EntitySharedQuery,
  type ErrorType,
  type PromiseResult,
  type Schema,
} from '@dossierhq/core';
import type { ResolvedAuthKey, TransactionContext } from '@dossierhq/database-adapter';
import { queryOne, type Database } from '../QueryFunctions.js';
import { totalAdminEntitiesQuery } from '../search/QueryGenerator.js';

export async function adminEntitySearchTotalCount(
  database: Database,
  schema: Schema,
  context: TransactionContext,
  query: EntitySharedQuery | undefined,
  resolvedAuthKeys: ResolvedAuthKey[],
): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const sqlQuery = totalAdminEntitiesQuery(schema, resolvedAuthKeys, query);
  if (sqlQuery.isError()) {
    return sqlQuery;
  }

  const result = await queryOne<{ count: number }>(database, context, sqlQuery.value);
  if (result.isError()) {
    return result;
  }
  return ok(result.value.count);
}
