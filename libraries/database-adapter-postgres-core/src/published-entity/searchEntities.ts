import type {
  ErrorType,
  PromiseResult,
  PublishedSchema,
  PublishedSearchQuery,
} from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabasePublishedEntitySearchPayload,
  ResolvedAuthKey,
  DatabasePagingInfo,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryMany } from '../QueryFunctions.js';
import type { SearchPublishedEntitiesItem } from '../search/QueryGenerator.js';
import { searchPublishedEntitiesQuery } from '../search/QueryGenerator.js';

export async function publishedEntitySearchEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: PublishedSchema,
  context: TransactionContext,
  query: PublishedSearchQuery | undefined,
  paging: DatabasePagingInfo,
  resolvedAuthKeys: ResolvedAuthKey[]
): PromiseResult<
  DatabasePublishedEntitySearchPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const sqlQueryResult = searchPublishedEntitiesQuery(
    databaseAdapter,
    schema,
    query,
    paging,
    resolvedAuthKeys
  );
  if (sqlQueryResult.isError()) return sqlQueryResult;
  const { cursorExtractor, sqlQuery } = sqlQueryResult.value;

  const searchResult = await queryMany<SearchPublishedEntitiesItem>(
    databaseAdapter,
    context,
    sqlQuery
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
    entities: entitiesValues.map((it) => ({
      id: it.uuid,
      type: it.type,
      name: it.name,
      createdAt: it.created_at,
      authKey: it.auth_key,
      fieldValues: it.data,
      cursor: cursorExtractor(it),
    })),
  });
}
