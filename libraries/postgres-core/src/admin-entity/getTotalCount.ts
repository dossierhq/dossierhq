import {
  ok,
  type AdminEntitySharedQuery,
  type Schema,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { ResolvedAuthKey, TransactionContext } from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryOne } from '../QueryFunctions.js';
import { totalAdminEntitiesQuery } from '../search/QueryGenerator.js';

export async function adminEntitySearchTotalCount(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: Schema,
  context: TransactionContext,
  query: AdminEntitySharedQuery | undefined,
  resolvedAuthKeys: ResolvedAuthKey[],
): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const sqlQuery = totalAdminEntitiesQuery(schema, resolvedAuthKeys, query);
  if (sqlQuery.isError()) return sqlQuery;

  const result = await queryOne<{ count: number }>(databaseAdapter, context, sqlQuery.value);
  if (result.isError()) return result;
  return ok(result.value.count);
}
