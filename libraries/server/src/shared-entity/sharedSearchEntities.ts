import type {
  Connection,
  Edge,
  ErrorType,
  Paging,
  PagingInfo,
  PromiseResult,
  Result,
} from '@jonasb/datadata-core';
import { getPagingInfo, ok } from '@jonasb/datadata-core';
import type {
  DatabaseAdminEntitySearchPayload,
  DatabasePublishedEntitySearchPayload,
  ResolvedPagingInfo,
} from '@jonasb/datadata-database-adapter';

const defaultPagingCount = 25;

export function resolvePagingInfo(
  paging: Paging | undefined
): Result<ResolvedPagingInfo, ErrorType.BadRequest> {
  const pagingResult = getPagingInfo(paging);
  if (pagingResult.isError()) return pagingResult;
  return ok({
    ...pagingResult.value,
    count: pagingResult.value.count ?? defaultPagingCount,
  });
}

export async function sharedSearchEntities<
  TSchema,
  TSearchResult extends DatabaseAdminEntitySearchPayload | DatabasePublishedEntitySearchPayload,
  TEntity
>(
  schema: TSchema,
  paging: PagingInfo,
  searchResult: TSearchResult,
  decoder: (schema: TSchema, values: TSearchResult['entities'][0]) => TEntity
): PromiseResult<Connection<Edge<TEntity, ErrorType>> | null, ErrorType.BadRequest> {
  const entities = searchResult.entities.map((it) => decoder(schema, it));
  if (entities.length === 0) {
    return ok(null);
  }

  return ok({
    pageInfo: {
      hasNextPage: paging.forwards ? searchResult.hasMore : false,
      hasPreviousPage: paging.forwards ? false : searchResult.hasMore,
      startCursor: searchResult.entities[0].cursor,
      endCursor: searchResult.entities[searchResult.entities.length - 1].cursor,
    },
    edges: entities.map((entity, index) => ({
      cursor: searchResult.entities[index].cursor,
      node: ok(entity),
    })),
  });
}
