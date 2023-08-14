import {
  getPagingInfo,
  ok,
  type Connection,
  type Edge,
  type ErrorType,
  type Paging,
  type PagingInfo,
  type Result,
  type PromiseResult,
} from '@dossierhq/core';
import type { DatabaseConnectionPayload, DatabasePagingInfo } from '@dossierhq/database-adapter';

//TODO move to constants or make configurable?
const defaultPagingCount = 25;

export async function fetchAndDecodeConnection<
  TEncodedEdge extends { cursor: string },
  TDecodedNode,
  TNodeError extends ErrorType,
>(
  paging: Paging | undefined,
  connectionFetcher: (
    pagingInfo: DatabasePagingInfo,
  ) => PromiseResult<
    DatabaseConnectionPayload<TEncodedEdge>,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >,
  decoder: (edge: TEncodedEdge) => Result<TDecodedNode, TNodeError>,
) {
  const pagingResult = resolvePagingInfo(paging);
  if (pagingResult.isError()) return pagingResult;
  const pagingInfo = pagingResult.value;

  const connectionResult = await connectionFetcher(pagingInfo);
  if (connectionResult.isError()) return connectionResult;

  let hasMoreOppositeDirection = false;
  const oppositePagingInfo = getOppositeDirectionPaging(pagingInfo, connectionResult.value);
  if (oppositePagingInfo) {
    const oppositeResult = await connectionFetcher(oppositePagingInfo);
    if (oppositeResult.isError()) return oppositeResult;
    hasMoreOppositeDirection = oppositeResult.value.hasMore;
  }

  return resolveConnectionPayload(
    pagingInfo,
    connectionResult.value,
    hasMoreOppositeDirection,
    decoder,
  );
}

function resolvePagingInfo(
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

function getOppositeDirectionPaging(
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

function resolveConnectionPayload<
  TEncodedEdge extends { cursor: string },
  TDecodedNode,
  TNodeError extends ErrorType,
>(
  paging: PagingInfo,
  payload: DatabaseConnectionPayload<TEncodedEdge>,
  hasMoreOppositeDirection: boolean,
  decoder: (edge: TEncodedEdge) => Result<TDecodedNode, TNodeError>,
): Result<Connection<Edge<TDecodedNode, TNodeError>> | null, typeof ErrorType.Generic> {
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
