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
import type { DatabaseConnectionPayload, DatabasePagingInfo } from '@dossierhq/database-adapter';

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

export function getOppositeDirectionPaging(
  pagingInfo: DatabasePagingInfo,
  payload: DatabaseConnectionPayload<{ cursor: string }>,
): DatabasePagingInfo | null {
  if (payload.edges.length === 0) {
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
  TEncodedEdge extends { cursor: string },
  TDecodedNode,
  TError extends ErrorType,
>(
  paging: PagingInfo,
  payload: DatabaseConnectionPayload<TEncodedEdge>,
  hasMoreOppositeDirection: boolean,
  decoder: (edge: TEncodedEdge) => Result<TDecodedNode, TError>,
): Result<Connection<Edge<TDecodedNode, TError>> | null, typeof ErrorType.Generic> {
  if (payload.edges.length === 0) {
    return ok(null);
  }

  const nodes = payload.edges.map((it) => decoder(it));

  return ok({
    pageInfo: {
      hasNextPage: paging.forwards ? payload.hasMore : hasMoreOppositeDirection,
      hasPreviousPage: paging.forwards ? hasMoreOppositeDirection : payload.hasMore,
      startCursor: payload.edges[0].cursor,
      endCursor: payload.edges[payload.edges.length - 1].cursor,
    },
    edges: nodes.map((node, index) => ({
      cursor: payload.edges[index].cursor,
      node,
    })),
  });
}
