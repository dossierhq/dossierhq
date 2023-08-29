import {
  ok,
  type ErrorType,
  type PromiseResult,
  type PublishedEntityQuery,
  type PublishedSchema,
} from '@dossierhq/core';
import type {
  DatabasePagingInfo,
  DatabasePublishedEntitySearchPayload,
  ResolvedAuthKey,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryMany } from '../QueryFunctions.js';
import type { SearchPublishedEntitiesItem } from '../search/QueryGenerator.js';
import { searchPublishedEntitiesQuery } from '../search/QueryGenerator.js';
import { resolveEntityFields, resolvePublishedEntityInfo } from '../utils/CodecUtils.js';

export async function publishedEntitySearchEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: PublishedSchema,
  context: TransactionContext,
  query: PublishedEntityQuery | undefined,
  paging: DatabasePagingInfo,
  resolvedAuthKeys: ResolvedAuthKey[],
): PromiseResult<
  DatabasePublishedEntitySearchPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const sqlQueryResult = searchPublishedEntitiesQuery(
    databaseAdapter,
    schema,
    query,
    paging,
    resolvedAuthKeys,
  );
  if (sqlQueryResult.isError()) return sqlQueryResult;
  const { cursorExtractor, sqlQuery } = sqlQueryResult.value;

  const searchResult = await queryMany<SearchPublishedEntitiesItem>(
    databaseAdapter,
    context,
    sqlQuery,
  );
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
    edges: entitiesValues.map((it) => ({
      ...resolvePublishedEntityInfo(it),
      ...resolveEntityFields(it),
      id: it.uuid,
      cursor: cursorExtractor(it),
    })),
  });
}
