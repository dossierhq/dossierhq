import {
  getPagingInfo,
  ok,
  type Connection,
  type Edge,
  type ErrorType,
  type Paging,
  type PagingInfo,
  type Result,
} from '@dossierhq/core';
import type {
  DatabaseAdminEntitySearchPayload,
  DatabaseEventGetChangelogEventsPayload,
  DatabasePagingInfo,
  DatabasePublishedEntitySearchPayload,
} from '@dossierhq/database-adapter';

//TODO move to constants or make configurable?
const defaultPagingCount = 25;

export function resolvePagingInfo(
  paging: Paging | undefined,
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
  TSearchResult extends
    | DatabaseAdminEntitySearchPayload
    | DatabasePublishedEntitySearchPayload
    | DatabaseEventGetChangelogEventsPayload,
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

export function resolveConnectionPayload<
  TEncodedNode extends { cursor: string },
  TDecodedNode,
  TError extends ErrorType,
>(
  paging: PagingInfo,
  payload: { hasMore: boolean; entities: TEncodedNode[] },
  hasMoreOppositeDirection: boolean,
  decoder: (node: TEncodedNode) => Result<TDecodedNode, TError>,
): Result<Connection<Edge<TDecodedNode, TError>> | null, typeof ErrorType.Generic> {
  if (payload.entities.length === 0) {
    return ok(null);
  }

  const nodes = payload.entities.map((it) => decoder(it));

  return ok({
    pageInfo: {
      hasNextPage: paging.forwards ? payload.hasMore : hasMoreOppositeDirection,
      hasPreviousPage: paging.forwards ? hasMoreOppositeDirection : payload.hasMore,
      startCursor: payload.entities[0].cursor,
      endCursor: payload.entities[payload.entities.length - 1].cursor,
    },
    edges: nodes.map((node, index) => ({
      cursor: payload.entities[index].cursor,
      node,
    })),
  });
}

export function sharedSearchEntities<
  TSchema,
  TSearchResult extends DatabaseAdminEntitySearchPayload | DatabasePublishedEntitySearchPayload,
  TEntity,
>(
  schema: TSchema,
  paging: PagingInfo,
  searchResult: TSearchResult,
  hasMoreOppositeDirection: boolean,
  decoder: (
    schema: TSchema,
    values: TSearchResult['entities'][number],
  ) => Result<TEntity, typeof ErrorType.BadRequest | typeof ErrorType.Generic>,
): Result<Connection<Edge<TEntity, ErrorType>> | null, typeof ErrorType.Generic> {
  return resolveConnectionPayload<
    TSearchResult['entities'][number],
    TEntity,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >(paging, searchResult, hasMoreOppositeDirection, (it) => decoder(schema, it));
}
