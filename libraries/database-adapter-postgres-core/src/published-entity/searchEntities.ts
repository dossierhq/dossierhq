import type {
  ErrorType,
  Paging,
  PromiseResult,
  PublishedSchema,
  PublishedSearchQuery,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabasePublishedEntitySearchPayload,
  ResolvedAuthKey,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '..';
import { queryMany } from '../QueryFunctions';
import type { SearchPublishedEntitiesItem } from '../search/QueryGenerator';
import { searchPublishedEntitiesQuery } from '../search/QueryGenerator';

export async function publishedEntitySearchEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: PublishedSchema,
  context: TransactionContext,
  query: PublishedSearchQuery | undefined,
  paging: Paging | undefined,
  resolvedAuthKeys: ResolvedAuthKey[]
): PromiseResult<DatabasePublishedEntitySearchPayload, ErrorType.BadRequest | ErrorType.Generic> {
  const sqlQueryResult = searchPublishedEntitiesQuery(
    databaseAdapter,
    schema,
    query,
    paging,
    resolvedAuthKeys
  );
  if (sqlQueryResult.isError()) {
    return sqlQueryResult;
  }
  const { cursorExtractor, pagingCount, isForwards } = sqlQueryResult.value;

  const searchResult = await queryMany<SearchPublishedEntitiesItem>(
    databaseAdapter,
    context,
    sqlQueryResult.value
  );
  if (searchResult.isError()) {
    return searchResult;
  }

  const entitiesValues = searchResult.value;

  const hasExtraPage = entitiesValues.length > pagingCount;
  if (hasExtraPage) {
    entitiesValues.splice(pagingCount, 1);
  }
  if (!isForwards) {
    // Reverse since DESC order returns the rows in the wrong order, we want them in the same order as for forwards pagination
    entitiesValues.reverse();
  }

  return ok({
    hasNextPage: isForwards ? hasExtraPage : false,
    hasPreviousPage: isForwards ? false : hasExtraPage,
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
