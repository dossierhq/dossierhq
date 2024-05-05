import {
  EntityQueryOrder,
  EntityStatus,
  getAllPagesForConnection,
  ok,
  PublishedEntityQueryOrder,
  type Connection,
  type Edge,
  type ErrorType,
  type OkResult,
  type PromiseResult,
  type Result,
} from '@dossierhq/core';
import {
  assertEquals,
  assertOkResult,
  assertResultValue,
  assertSame,
  assertTruthy,
} from '../Asserts.js';
import type {
  AppDossierClient,
  AppEntity,
  AppPublishedDossierClient,
  AppPublishedEntity,
} from '../SchemaTypes.js';

const adminOrderCompare: Record<EntityQueryOrder, (a: AppEntity, b: AppEntity) => number> = {
  [EntityQueryOrder.createdAt]: (a, b) => a.info.createdAt.getTime() - b.info.createdAt.getTime(),
  [EntityQueryOrder.updatedAt]: (a, b) => a.info.updatedAt.getTime() - b.info.updatedAt.getTime(),
  [EntityQueryOrder.name]: (a, b) => a.info.name.localeCompare(b.info.name),
};

const adminOrderExtract: Record<EntityQueryOrder, (it: AppEntity) => unknown> = {
  [EntityQueryOrder.createdAt]: (it) => it.info.createdAt,
  [EntityQueryOrder.updatedAt]: (it) => it.info.updatedAt,
  [EntityQueryOrder.name]: (it) => it.info.name,
};

const publishedOrderCompare: Record<
  PublishedEntityQueryOrder,
  (a: AppPublishedEntity, b: AppPublishedEntity) => number
> = {
  [PublishedEntityQueryOrder.createdAt]: (a, b) =>
    a.info.createdAt.getTime() - b.info.createdAt.getTime(),
  [PublishedEntityQueryOrder.name]: (a, b) => a.info.name.localeCompare(b.info.name),
};

export function assertAdminEntityConnectionToMatchSlice(
  allEntities: AppEntity[],
  connectionResult: Result<Connection<Edge<AppEntity, ErrorType>> | null, ErrorType>,
  sliceStart: number,
  sliceEnd: number | undefined,
  order?: EntityQueryOrder,
  reverse?: boolean,
): void {
  const resolvedOrder = order ?? EntityQueryOrder.createdAt;
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
  allEntities: AppPublishedEntity[],
  connectionResult: Result<Connection<Edge<AppPublishedEntity, ErrorType>> | null, ErrorType>,
  sliceStart: number,
  sliceEnd: number | undefined,
  order?: PublishedEntityQueryOrder,
  reverse?: boolean,
): void {
  assertOkResult(connectionResult);
  const connection = connectionResult.value;
  const actualIds = connection?.edges.map((edge) => ({
    id: edge.node.isOk() ? edge.node.value.id : edge.node,
  }));

  const allEntitiesOrdered = [...allEntities].sort(
    publishedOrderCompare[order ?? PublishedEntityQueryOrder.createdAt],
  );
  if (reverse) allEntitiesOrdered.reverse();
  const expectedEntities = allEntitiesOrdered.slice(sliceStart, sliceEnd);
  const expectedIds = expectedEntities.map(({ id }) => ({ id }));

  assertEquals(actualIds, expectedIds);
}

export function assertSearchResultEntities<TItem extends AppEntity | AppPublishedEntity>(
  result: Result<
    Connection<Edge<TItem, ErrorType>> | null,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
  >,
  actualEntities: TItem[],
): asserts result is OkResult<
  Connection<Edge<TItem, ErrorType>> | null,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  assertOkResult(result);
  if (actualEntities.length === 0) {
    assertSame(result.value, null);
  } else {
    assertTruthy(result.value);
    assertEquals(result.value.edges.length, actualEntities.length);
    for (const [index, actualEntity] of actualEntities.entries()) {
      assertResultValue(result.value.edges[index].node, actualEntity);
    }
  }
}

export function assertPageInfoEquals<TEntity extends AppEntity | AppPublishedEntity>(
  connectionResult: Result<Connection<Edge<TEntity, ErrorType>> | null, ErrorType>,
  { hasNextPage, hasPreviousPage }: { hasNextPage: boolean; hasPreviousPage: boolean },
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

export async function countSearchResultWithEntity<
  TClient extends AppDossierClient | AppPublishedDossierClient,
>(
  client: TClient,
  query: Parameters<TClient['getEntities']>[0],
  entityId: string,
): PromiseResult<
  number,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const result = await collectMatchingSearchResultNodes(
    client,
    query,
    (node) => node.isOk() && node.value.id === entityId,
  );
  if (result.isError()) return result;
  return ok(result.value.length);
}

export async function collectMatchingSearchResultNodes<
  TClient extends AppDossierClient | AppPublishedDossierClient,
>(
  client: TClient,
  query: Parameters<TClient['getEntities']>[0],
  matcher: (node: Awaited<ReturnType<TClient['getEntity']>>) => boolean,
): PromiseResult<
  Awaited<ReturnType<TClient['getEntity']>>[],
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const matches: Awaited<ReturnType<TClient['getEntity']>>[] = [];

  for await (const pageResult of getAllPagesForConnection<
    Edge<AppEntity | AppPublishedEntity, ErrorType>,
    typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  >({ first: 50 }, (currentPaging) => client.getEntities(query as any, currentPaging))) {
    if (pageResult.isError()) return pageResult;
    for (const edge of pageResult.value.edges) {
      const node = edge.node as Awaited<ReturnType<TClient['getEntity']>>;
      if (matcher(node)) {
        matches.push(node);
      }
    }
  }

  return ok(matches);
}

export async function countSearchResultStatuses(
  client: AppDossierClient,
  query: Parameters<AppDossierClient['getEntities']>[0],
): PromiseResult<
  Record<EntityStatus | 'valid' | 'invalid', number>,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const result = {
    [EntityStatus.draft]: 0,
    [EntityStatus.published]: 0,
    [EntityStatus.modified]: 0,
    [EntityStatus.withdrawn]: 0,
    [EntityStatus.archived]: 0,
    valid: 0,
    invalid: 0,
  };

  for await (const pageResult of getAllPagesForConnection({ first: 50 }, (currentPaging) =>
    client.getEntities(query, currentPaging),
  )) {
    if (pageResult.isError()) {
      return pageResult;
    }
    for (const edge of pageResult.value.edges) {
      if (edge.node.isOk()) {
        const entity = edge.node.value;
        result[entity.info.status] += 1;
        if (entity.info.valid && entity.info.validPublished !== false) {
          result.valid += 1;
        } else {
          result.invalid += 1;
        }
      }
    }
  }

  return ok(result);
}
