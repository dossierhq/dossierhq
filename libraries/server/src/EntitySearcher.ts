import type { Connection, Edge, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { DatabaseAdminEntitySearchPayload } from '.';
import type {
  SearchAdminEntitiesItem,
  SearchPublishedEntitiesItem,
  SharedEntitiesQuery,
} from './QueryGenerator';

export async function sharedSearchEntities<
  TSchema,
  TEntity,
  TDbItem extends SearchAdminEntitiesItem | SearchPublishedEntitiesItem
>(
  schema: TSchema,
  sqlQuery: SharedEntitiesQuery<TDbItem>,
  entitiesValues: TDbItem[],
  decoder: (schema: TSchema, rowValues: TDbItem) => TEntity
): PromiseResult<Connection<Edge<TEntity, ErrorType>> | null, ErrorType.BadRequest> {
  const hasExtraPage = entitiesValues.length > sqlQuery.pagingCount;
  if (hasExtraPage) {
    entitiesValues.splice(sqlQuery.pagingCount, 1);
  }

  if (!sqlQuery.isForwards) {
    // Reverse since DESC order returns the rows in the wrong order, we want them in the same order as for forwards pagination
    entitiesValues.reverse();
  }

  const entities = entitiesValues.map((it) => decoder(schema, it));
  if (entities.length === 0) {
    return ok(null);
  }

  const { cursorExtractor } = sqlQuery;
  return ok({
    pageInfo: {
      hasNextPage: sqlQuery.isForwards ? hasExtraPage : false,
      hasPreviousPage: sqlQuery.isForwards ? false : hasExtraPage,
      startCursor: cursorExtractor(entitiesValues[0]),
      endCursor: cursorExtractor(entitiesValues[entitiesValues.length - 1]),
    },
    edges: entities.map((entity, index) => ({
      cursor: cursorExtractor(entitiesValues[index]),
      node: ok(entity),
    })),
  });
}

export async function sharedSearchEntities2<
  TSchema,
  TSearchResult extends DatabaseAdminEntitySearchPayload,
  TEntity
>(
  schema: TSchema,
  searchResult: TSearchResult,
  decoder: (schema: TSchema, values: TSearchResult['entities'][0]) => TEntity
): PromiseResult<Connection<Edge<TEntity, ErrorType>> | null, ErrorType.BadRequest> {
  const entities = searchResult.entities.map((it) => decoder(schema, it));
  if (entities.length === 0) {
    return ok(null);
  }

  return ok({
    pageInfo: {
      hasNextPage: searchResult.hasNextPage,
      hasPreviousPage: searchResult.hasPreviousPage,
      startCursor: searchResult.entities[0].cursor,
      endCursor: searchResult.entities[searchResult.entities.length - 1].cursor,
    },
    edges: entities.map((entity, index) => ({
      cursor: searchResult.entities[index].cursor,
      node: ok(entity),
    })),
  });
}
