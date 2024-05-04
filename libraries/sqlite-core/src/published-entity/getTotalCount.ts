import {
  ok,
  type ErrorType,
  type PromiseResult,
  type PublishedEntitySharedQuery,
  type PublishedSchema,
} from '@dossierhq/core';
import type { ResolvedAuthKey, TransactionContext } from '@dossierhq/database-adapter';
import { queryOne, type Database } from '../QueryFunctions.js';
import { totalPublishedEntitiesQuery } from '../search/QueryGenerator.js';

export async function publishedEntitySearchTotalCount(
  database: Database,
  schema: PublishedSchema,
  context: TransactionContext,
  query: PublishedEntitySharedQuery | undefined,
  resolvedAuthKeys: ResolvedAuthKey[],
): PromiseResult<number, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const sqlQuery = totalPublishedEntitiesQuery(schema, resolvedAuthKeys, query);
  if (sqlQuery.isError()) return sqlQuery;

  const result = await queryOne<{ count: number }>(database, context, sqlQuery.value);
  if (result.isError()) return result;
  return ok(result.value.count);
}
