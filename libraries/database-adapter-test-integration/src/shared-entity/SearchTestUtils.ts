import type {
  AdminClient,
  AdminEntity,
  AdminSearchQuery,
  Connection,
  Edge,
  ErrorType,
  OkResult,
  PromiseResult,
  PublishedClient,
  PublishedEntity,
  PublishedSearchQuery,
  Result,
} from '@dossierhq/core';
import {
  AdminEntityStatus,
  AdminQueryOrder,
  assertIsDefined,
  getAllPagesForConnection,
  ok,
  PublishedQueryOrder,
} from '@dossierhq/core';
import {
  assertEquals,
  assertOkResult,
  assertResultValue,
  assertSame,
  assertTruthy,
} from '../Asserts.js';

const adminOrderCompare: Record<AdminQueryOrder, (a: AdminEntity, b: AdminEntity) => number> = {
  [AdminQueryOrder.createdAt]: (a, b) => a.info.createdAt.getTime() - b.info.createdAt.getTime(),
  [AdminQueryOrder.updatedAt]: (a, b) => a.info.updatedAt.getTime() - b.info.updatedAt.getTime(),
  [AdminQueryOrder.name]: (a, b) => a.info.name.localeCompare(b.info.name),
};

const adminOrderExtract: Record<AdminQueryOrder, (it: AdminEntity) => unknown> = {
  [AdminQueryOrder.createdAt]: (it) => it.info.createdAt,
  [AdminQueryOrder.updatedAt]: (it) => it.info.updatedAt,
  [AdminQueryOrder.name]: (it) => it.info.name,
};

const publishedOrderCompare: Record<
  PublishedQueryOrder,
  (a: PublishedEntity, b: PublishedEntity) => number
> = {
  [PublishedQueryOrder.createdAt]: (a, b) =>
    a.info.createdAt.getTime() - b.info.createdAt.getTime(),
  [PublishedQueryOrder.name]: (a, b) => a.info.name.localeCompare(b.info.name),
};

export function assertAdminEntityConnectionToMatchSlice(
  allEntities: AdminEntity[],
  connectionResult: Result<Connection<Edge<AdminEntity, ErrorType>> | null, ErrorType>,
  sliceStart: number,
  sliceEnd: number | undefined,
  order?: AdminQueryOrder,
  reverse?: boolean
): void {
  const resolvedOrder = order ?? AdminQueryOrder.createdAt;
  const orderExtractor = adminOrderExtract[resolvedOrder];

  assertOkResult(connectionResult);
  const connection = connectionResult.value;
  const actualIds = connection?.edges.map((edge) => ({
    id: edge.node.isOk() ? edge.node.value.id : edge.node,
    order: edge.node.isOk() ? orderExtractor(edge.node.value) : null,
  }));

  const allEntitiesOrdered = [...allEntities].sort(adminOrderCompare[resolvedOrder]);
  if (reverse) allEntitiesOrdered.reverse();
  const expectedEntities = allEntitiesOrdered.slice(sliceStart, sliceEnd);
  const expectedIds = expectedEntities.map((it) => ({ id: it.id, order: orderExtractor(it) }));

  assertEquals(actualIds, expectedIds);
}

export function assertPublishedEntityConnectionToMatchSlice(
  allEntities: PublishedEntity[],
  connectionResult: Result<Connection<Edge<PublishedEntity, ErrorType>> | null, ErrorType>,
  sliceStart: number,
  sliceEnd: number | undefined,
  order?: PublishedQueryOrder,
  reverse?: boolean
): void {
  assertOkResult(connectionResult);
  const connection = connectionResult.value;
  const actualIds = connection?.edges.map((edge) => ({
    id: edge.node.isOk() ? edge.node.value.id : edge.node,
  }));

  const allEntitiesOrdered = [...allEntities].sort(
    publishedOrderCompare[order ?? PublishedQueryOrder.createdAt]
  );
  if (reverse) allEntitiesOrdered.reverse();
  const expectedEntities = allEntitiesOrdered.slice(sliceStart, sliceEnd);
  const expectedIds = expectedEntities.map(({ id }) => ({ id }));

  assertEquals(actualIds, expectedIds);
}

export function assertSearchResultEntities<TItem extends AdminEntity | PublishedEntity>(
  result: Result<
    Connection<Edge<TItem, ErrorType>> | null,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >,
  actualEntities: TItem[]
): asserts result is OkResult<
  Connection<Edge<TItem, ErrorType>> | null,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  assertOkResult(result);
  if (actualEntities.length === 0) {
    assertSame(result.value, null);
  } else {
    assertIsDefined(result.value);
    assertEquals(result.value.edges.length, actualEntities.length);
    for (const [index, actualEntity] of actualEntities.entries()) {
      assertResultValue(result.value.edges[index].node, actualEntity);
    }
  }
}

export function assertPageInfoEquals(
  connectionResult: Result<Connection<Edge<PublishedEntity, ErrorType>> | null, ErrorType>,
  { hasNextPage, hasPreviousPage }: { hasNextPage: boolean; hasPreviousPage: boolean }
) {
  assertOkResult(connectionResult);
  assertTruthy(connectionResult.value);
  const connection = connectionResult.value;

  assertEquals(connection.pageInfo, {
    startCursor: connection.edges[0].cursor,
    endCursor: connection.edges[connection.edges.length - 1].cursor,
    hasNextPage,
    hasPreviousPage,
  });
}

export async function countSearchResultWithEntity(
  client: AdminClient,
  query: AdminSearchQuery,
  entityId: string
): PromiseResult<
  number,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
>;
export async function countSearchResultWithEntity(
  client: PublishedClient,
  query: PublishedSearchQuery,
  entityId: string
): PromiseResult<
  number,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
>;
export async function countSearchResultWithEntity(
  client: AdminClient | PublishedClient,
  query: AdminSearchQuery | PublishedSearchQuery,
  entityId: string
): PromiseResult<
  number,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  let matchCount = 0;

  for await (const pageResult of getAllPagesForConnection({ first: 50 }, (currentPaging) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client.searchEntities(query as any, currentPaging)
  )) {
    if (pageResult.isError()) {
      return pageResult;
    }
    for (const edge of pageResult.value.edges) {
      if (edge.node.isOk() && edge.node.value.id === entityId) {
        matchCount += 1;
      }
    }
  }

  return ok(matchCount);
}

export async function countSearchResultStatuses(
  client: AdminClient,
  query: AdminSearchQuery
): PromiseResult<
  Record<AdminEntityStatus, number>,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const result = {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    [AdminEntityStatus.archived]: 0,
  };

  for await (const pageResult of getAllPagesForConnection({ first: 50 }, (currentPaging) =>
    client.searchEntities(query, currentPaging)
  )) {
    if (pageResult.isError()) {
      return pageResult;
    }
    for (const edge of pageResult.value.edges) {
      if (edge.node.isOk()) {
        const entity = edge.node.value;
        result[entity.info.status] += 1;
      }
    }
  }

  return ok(result);
}
