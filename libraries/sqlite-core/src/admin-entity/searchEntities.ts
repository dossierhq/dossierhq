import type { AdminSchema, AdminSearchQuery, ErrorType, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabaseAdminEntitySearchPayload,
  DatabasePagingInfo,
  ResolvedAuthKey,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';
import type { SearchAdminEntitiesItem } from '../search/QueryGenerator.js';
import { searchAdminEntitiesQuery } from '../search/QueryGenerator.js';
import { resolveAdminEntityInfo } from '../utils/CodecUtils.js';

export async function adminEntitySearchEntities(
  database: Database,
  schema: AdminSchema,
  context: TransactionContext,
  query: AdminSearchQuery | undefined,
  paging: DatabasePagingInfo,
  resolvedAuthKeys: ResolvedAuthKey[],
): PromiseResult<
  DatabaseAdminEntitySearchPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const sqlQueryResult = searchAdminEntitiesQuery(
    database,
    schema,
    query,
    paging,
    resolvedAuthKeys,
  );
  if (sqlQueryResult.isError()) return sqlQueryResult;
  const { cursorExtractor, sqlQuery } = sqlQueryResult.value;

  const searchResult = await queryMany<SearchAdminEntitiesItem>(database, context, sqlQuery);
  if (searchResult.isError()) return searchResult;

  const entitiesValues = searchResult.value;

  const hasMore = entitiesValues.length > paging.count;
  if (hasMore) {
    entitiesValues.splice(paging.count, 1);
  }
  if (!paging.forwards) {
    // Reverse since DESC order returns the rows in the wrong order, we want them in the same order as for forwards pagination
    entitiesValues.reverse();
  }

  return ok({
    hasMore,
    entities: entitiesValues.map((it) => ({
      ...resolveAdminEntityInfo(it),
      id: it.uuid,
      fieldValues: JSON.parse(it.fields) as Record<string, unknown>,
      cursor: cursorExtractor(it),
    })),
  });
}
