import type {
  AdminEntity,
  Connection,
  Edge,
  ErrorType,
  PublishedEntity,
  Result,
} from '@jonasb/datadata-core';
import { AdminQueryOrder, PublishedQueryOrder } from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import { assertEquals, assertOkResult } from '../Asserts';

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
