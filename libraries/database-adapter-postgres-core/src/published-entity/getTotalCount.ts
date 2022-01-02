import type {
  ErrorType,
  PromiseResult,
  PublishedQuery,
  PublishedSchema,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { ResolvedAuthKey, TransactionContext } from '@jonasb/datadata-server';
import type { PostgresDatabaseAdapter } from '..';
import { queryOne } from '../QueryFunctions';
import { totalPublishedEntitiesQuery } from '../search/QueryGenerator';

export async function publishedEntitySearchTotalCount(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: PublishedSchema,
  context: TransactionContext,
  query: PublishedQuery | undefined,
  resolvedAuthKeys: ResolvedAuthKey[]
): PromiseResult<number, ErrorType.BadRequest | ErrorType.Generic> {
  const sqlQuery = totalPublishedEntitiesQuery(schema, resolvedAuthKeys, query);
  if (sqlQuery.isError()) {
    return sqlQuery;
  }

  const result = await queryOne<{ count: number }>(databaseAdapter, context, sqlQuery.value);
  if (result.isError()) {
    return result;
  }
  return ok(result.value.count);
}
