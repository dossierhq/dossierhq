import type {
  ErrorType,
  PromiseResult,
  PublishedSchema,
  PublishedSearchQuery,
} from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type {
  DatabasePagingInfo,
  DatabasePublishedEntitySearchPayload,
  ResolvedAuthKey,
  TransactionContext,
} from '@dossierhq/database-adapter';
import type { Database } from '../QueryFunctions.js';
import { queryMany } from '../QueryFunctions.js';
import type { SearchPublishedEntitiesItem } from '../search/QueryGenerator.js';
import { searchPublishedEntitiesQuery } from '../search/QueryGenerator.js';

export async function publishedEntitySearchEntities(
  database: Database,
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
    database,
    schema,
    query,
    paging,
    resolvedAuthKeys
  );
  if (sqlQueryResult.isError()) return sqlQueryResult;
  const { cursorExtractor, sqlQuery } = sqlQueryResult.value;

  const searchResult = await queryMany<SearchPublishedEntitiesItem>(database, context, sqlQuery);
  if (searchResult.isError()) {
    return searchResult;
  }

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
      createdAt: new Date(it.created_at),
      authKey: it.auth_key,
      fieldValues: JSON.parse(it.fields),
      cursor: cursorExtractor(it),
    })),
  });
}