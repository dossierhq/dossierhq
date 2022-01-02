import type {
  ErrorType,
  Paging,
  PromiseResult,
  PublishedQuery,
  PublishedSchema,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { ResolvedAuthKey, TransactionContext } from '@jonasb/datadata-server';
import type { DatabasePublishedEntitySearchPayload } from '@jonasb/datadata-server/lib/cjs/DatabaseAdapter';
import type { PostgresDatabaseAdapter } from '..';
import { queryMany } from '../QueryFunctions';
import type { SearchPublishedEntitiesItem } from '../search/QueryGenerator';
import { searchPublishedEntitiesQuery } from '../search/QueryGenerator';

export async function publishedEntitySearchEntities(
  databaseAdapter: PostgresDatabaseAdapter,
  schema: PublishedSchema,
  context: TransactionContext,
  query: PublishedQuery | undefined,
  paging: Paging | undefined,
  resolvedAuthKeys: ResolvedAuthKey[]
): PromiseResult<DatabasePublishedEntitySearchPayload, ErrorType.BadRequest | ErrorType.Generic> {
  const sqlQueryResult = searchPublishedEntitiesQuery(schema, query, paging, resolvedAuthKeys);
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
