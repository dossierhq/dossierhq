import type {
  AdminClient,
  AdminEntity,
  AdminQuery,
  Connection,
  Edge,
  ErrorType,
  PromiseResult,
  PublishedEntity,
  Result,
} from '@jonasb/datadata-core';
import {
  AdminEntityStatus,
  AdminQueryOrder,
  assertIsDefined,
  getAllPagesForConnection,
  ok,
  PublishedQueryOrder,
} from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import { assertEquals, assertOkResult, assertResultValue, assertSame } from '../Asserts';

const adminOrderCompare: Record<AdminQueryOrder, (a: AdminEntity, b: AdminEntity) => number> = {
  [AdminQueryOrder.createdAt]: (a, b) =>
    Temporal.Instant.compare(a.info.createdAt, b.info.createdAt),
  [AdminQueryOrder.updatedAt]: (a, b) =>
    Temporal.Instant.compare(a.info.updatedAt, b.info.updatedAt),
  [AdminQueryOrder.name]: (a, b) => a.info.name.localeCompare(b.info.name),
};

const publishedOrderCompare: Record<
  PublishedQueryOrder,
  (a: PublishedEntity, b: PublishedEntity) => number
> = {
  [PublishedQueryOrder.createdAt]: (a, b) =>
    Temporal.Instant.compare(a.info.createdAt, b.info.createdAt),
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
  assertOkResult(connectionResult);
  const connection = connectionResult.value;
  const actualIds = connection?.edges.map((edge) => ({
    id: edge.node.isOk() ? edge.node.value.id : edge.node,
  }));

  const allEntitiesOrdered = [...allEntities].sort(
    adminOrderCompare[order ?? AdminQueryOrder.createdAt]
  );
  if (reverse) allEntitiesOrdered.reverse();
  const expectedEntities = allEntitiesOrdered.slice(sliceStart, sliceEnd);
  const expectedIds = expectedEntities.map(({ id }) => ({ id }));

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
    ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
  >,
  actualEntities: TItem[]
): void {
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

export async function countSearchResultStatuses(
  client: AdminClient,
  query: AdminQuery
): PromiseResult<
  Record<AdminEntityStatus, number>,
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
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
