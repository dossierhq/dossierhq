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

export function getOppositeDirectionPaging<
  TSearchResult extends DatabaseAdminEntitySearchPayload | DatabasePublishedEntitySearchPayload
>(pagingInfo: ResolvedPagingInfo, result: TSearchResult): ResolvedPagingInfo | null {
  if (result.entities.length === 0) {
    // If we don't get any entities in the normal direction we won't return any PageInfo, only null
    return null;
  }

  if (pagingInfo.forwards && pagingInfo.after) {
    return {
      count: 0,
      forwards: false,
      before: pagingInfo.after,
      after: null,
    };
  }
  if (!pagingInfo.forwards && pagingInfo.before) {
    return {
      count: 0,
      forwards: true,
      after: null,
      before: pagingInfo.after,
    };
  }
  return null;
}

export async function sharedSearchEntities<
  TSchema,
  TSearchResult extends DatabaseAdminEntitySearchPayload | DatabasePublishedEntitySearchPayload,
  TEntity
>(
  schema: TSchema,
  paging: PagingInfo,
  searchResult: TSearchResult,
  hasMoreOppositeDirection: boolean,
  decoder: (schema: TSchema, values: TSearchResult['entities'][0]) => TEntity
): PromiseResult<Connection<Edge<TEntity, ErrorType>> | null, ErrorType.BadRequest> {
  const entities = searchResult.entities.map((it) => decoder(schema, it));
  if (entities.length === 0) {
    return ok(null);
  }

  return ok({
    pageInfo: {
      hasNextPage: paging.forwards ? searchResult.hasMore : hasMoreOppositeDirection,
      hasPreviousPage: paging.forwards ? hasMoreOppositeDirection : searchResult.hasMore,
      startCursor: searchResult.entities[0].cursor,
      endCursor: searchResult.entities[searchResult.entities.length - 1].cursor,
    },
    edges: entities.map((entity, index) => ({
      cursor: searchResult.entities[index].cursor,
      node: ok(entity),
    })),
  });
}
