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
import { resolvePaging } from '../search/Paging';
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
  const pagingResult = resolvePaging(paging);
  if (pagingResult.isError()) return pagingResult;
  const { forwards, count } = pagingResult.value;

  const sqlQueryResult = searchPublishedEntitiesQuery(
    databaseAdapter,
    schema,
    query,
    pagingResult.value,
    resolvedAuthKeys
  );
  if (sqlQueryResult.isError()) {
    return sqlQueryResult;
  }
  const { cursorExtractor, sqlQuery } = sqlQueryResult.value;

  const searchResult = await queryMany<SearchPublishedEntitiesItem>(
    databaseAdapter,
    context,
    sqlQuery
  );
  if (searchResult.isError()) {
    return searchResult;
  }

  const entitiesValues = searchResult.value;

  const hasExtraPage = entitiesValues.length > count;
  if (hasExtraPage) {
    entitiesValues.splice(count, 1);
  }
  if (!forwards) {
    // Reverse since DESC order returns the rows in the wrong order, we want them in the same order as for forwards pagination
    entitiesValues.reverse();
  }

  return ok({
    hasNextPage: forwards ? hasExtraPage : false,
    hasPreviousPage: forwards ? false : hasExtraPage,
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
