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
  DatabasePagingInfo,
  DatabasePublishedEntitySearchPayload,
} from '@jonasb/datadata-database-adapter';

//TODO move to constants or make configurable?
const defaultPagingCount = 25;

export function resolvePagingInfo(
  paging: Paging | undefined
): Result<DatabasePagingInfo, typeof ErrorType.BadRequest> {
  const pagingResult = getPagingInfo(paging);
  if (pagingResult.isError()) return pagingResult;

  return ok({
    ...pagingResult.value,
    after: paging?.after ?? null,
    afterInclusive: false,
    before: paging?.before ?? null,
    beforeInclusive: false,
    count: pagingResult.value.count ?? defaultPagingCount,
  });
}

export function getOppositeDirectionPaging<
  TSearchResult extends DatabaseAdminEntitySearchPayload | DatabasePublishedEntitySearchPayload
>(pagingInfo: DatabasePagingInfo, result: TSearchResult): DatabasePagingInfo | null {
  if (result.entities.length === 0) {
    // If we don't get any entities in the normal direction we won't return any PageInfo, only null
    return null;
  }

  if (pagingInfo.forwards && pagingInfo.after) {
    return {
      count: 0,
      forwards: false,
      before: pagingInfo.after,
      beforeInclusive: true,
      after: null,
      afterInclusive: false,
    };
  }
  if (!pagingInfo.forwards && pagingInfo.before) {
    return {
      count: 0,
      forwards: true,
      after: null,
      afterInclusive: false,
      before: pagingInfo.after,
      beforeInclusive: true,
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
  decoder: (schema: TSchema, values: TSearchResult['entities'][number]) => TEntity
): PromiseResult<Connection<Edge<TEntity, ErrorType>> | null, typeof ErrorType.BadRequest> {
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
