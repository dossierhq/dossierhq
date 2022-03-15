import type {
  ErrorType,
  PromiseResult,
  PublishedSchema,
  PublishedSearchQuery,
} from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type {
  DatabasePublishedEntitySearchPayload2,
  ResolvedAuthKey,
  ResolvedPagingInfo,
  TransactionContext,
} from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import type { SqliteDatabaseAdapter } from '..';
import { queryMany } from '../QueryFunctions';
import type { SearchPublishedEntitiesItem } from '../search/QueryGenerator';
import { searchPublishedEntitiesQuery } from '../search/QueryGenerator';

export async function publishedEntitySearchEntities(
  databaseAdapter: SqliteDatabaseAdapter,
  schema: PublishedSchema,
  context: TransactionContext,
  query: PublishedSearchQuery | undefined,
  paging: ResolvedPagingInfo,
  resolvedAuthKeys: ResolvedAuthKey[]
): PromiseResult<DatabasePublishedEntitySearchPayload2, ErrorType.BadRequest | ErrorType.Generic> {
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
      createdAt: Temporal.Instant.from(it.created_at),
      authKey: it.auth_key,
      fieldValues: JSON.parse(it.fields),
      cursor: cursorExtractor(it),
    })),
  });
}
