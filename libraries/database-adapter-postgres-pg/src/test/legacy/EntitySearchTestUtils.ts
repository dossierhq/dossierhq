import type {
  AdminClient,
  AdminEntity,
  AdminQuery,
  BoundingBox,
  Connection,
  Edge,
  Entity,
  ErrorType,
  PromiseResult,
  PublishedClient,
  Query,
} from '@jonasb/datadata-core';
import { AdminEntityStatus, getAllPagesForConnection, ok } from '@jonasb/datadata-core';

export async function ensureEntityCount(
  client: AdminClient,
  requestedCount: number,
  entityType: string,
  authKey: string,
  fieldProvider: (random: string) => Record<string, unknown>
): PromiseResult<
  void,
  | ErrorType.BadRequest
  | ErrorType.Conflict
  | ErrorType.NotFound
  | ErrorType.NotAuthorized
  | ErrorType.Generic
> {
  const countResult = await client.getTotalCount({
    authKeys: [authKey],
    entityTypes: [entityType],
  });
  if (countResult.isError()) return countResult;

  for (let count = countResult.value; count < requestedCount; count += 1) {
    const random = String(Math.random()).slice(2);
    const createResult = await client.createEntity({
      info: { type: entityType, name: random, authKey },
      fields: fieldProvider(random),
    });
    if (createResult.isError()) {
      return createResult;
    }
    const {
      entity: {
        id,
        info: { version },
      },
    } = createResult.value;
    const publishResult = await client.publishEntities([{ id, version, authKeys: [authKey] }]);
    if (publishResult.isError()) {
      return publishResult;
    }
  }
  return ok(undefined);
}

export async function ensureEntityWithStatus(
  client: AdminClient,
  entityType: string,
  authKey: string,
  status: AdminEntityStatus,
  fieldProvider: (random: string) => Record<string, unknown>
): PromiseResult<
  void,
  | ErrorType.BadRequest
  | ErrorType.Conflict
  | ErrorType.NotFound
  | ErrorType.NotAuthorized
  | ErrorType.Generic
> {
  const countResult = await client.getTotalCount({
    entityTypes: [entityType],
    status: [status],
  });
  if (countResult.isError()) return countResult;
  if (countResult.value > 0) return ok(undefined);

  const random = String(Math.random()).slice(2);
  const createResult = await client.createEntity({
    info: { type: entityType, name: random, authKey },
    fields: fieldProvider(random),
  });
  if (createResult.isError()) {
    return createResult;
  }
  const { entity } = createResult.value;
  switch (status) {
    case AdminEntityStatus.draft:
      break;
    case AdminEntityStatus.published: {
      const publishResult = await client.publishEntities([
        { id: entity.id, version: entity.info.version },
      ]);
      if (publishResult.isError()) return publishResult;
      break;
    }
    case AdminEntityStatus.modified: {
      const publishResult = await client.publishEntities([
        { id: entity.id, version: entity.info.version },
      ]);
      if (publishResult.isError()) return publishResult;
      const updateResult = await client.updateEntity({
        id: entity.id,
        info: { name: String(Math.random()).slice(2) },
        fields: {},
      });
      if (updateResult.isError()) return updateResult;
      break;
    }
    case AdminEntityStatus.withdrawn: {
      const publishResult = await client.publishEntities([
        { id: entity.id, version: entity.info.version },
      ]);
      if (publishResult.isError()) return publishResult;
      const updateResult = await client.unpublishEntities([{ id: entity.id }]);
      if (updateResult.isError()) return updateResult;
      break;
    }
    case AdminEntityStatus.archived: {
      const archiveResult = await client.archiveEntity({ id: entity.id });
      if (archiveResult.isError()) return archiveResult;
      break;
    }
  }

  return ok(undefined);
}

export async function getAllEntities(
  client: AdminClient,
  query: AdminQuery
): PromiseResult<
  AdminEntity[],
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const entities: AdminEntity[] = [];
  for await (const pageResult of getAllPagesForConnection({ first: 100 }, (currentPaging) =>
    client.searchEntities(query, currentPaging)
  )) {
    if (pageResult.isError()) {
      return pageResult;
    }

    for (const edge of pageResult.value.edges) {
      if (edge.node.isOk()) {
        const entity = edge.node.value;
        entities.push(entity);
      }
    }
  }
  return ok(entities);
}

export function expectConnectionToMatchSlice<TEntity extends Entity | AdminEntity>(
  allEntities: TEntity[],
  connection: Connection<Edge<TEntity, ErrorType>> | null,
  sliceStart: number,
  sliceEnd: number | undefined,
  compareFn?: (a: TEntity, b: TEntity) => number
): void {
  const actualIds = connection?.edges.map((edge) => ({
    id: edge.node.isOk() ? edge.node.value.id : edge.node,
  }));

  let expectedEntities = allEntities;
  if (compareFn) {
    expectedEntities = [...allEntities].sort(compareFn);
  }

  const expectedIds = expectedEntities.slice(sliceStart, sliceEnd).map((x) => ({ id: x.id }));

  expect(actualIds).toEqual(expectedIds);
}

/** Random bounding box (which doesn't wrap 180/-180 longitude) */
export function randomBoundingBox(heightLat = 1.0, widthLng = 1.0): BoundingBox {
  function randomInRange(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  const minLat = randomInRange(-90, 90 - heightLat);
  const minLng = randomInRange(-180, 180 - widthLng);
  const maxLat = minLat + heightLat;
  const maxLng = minLng + widthLng;
  return { minLat, maxLat, minLng, maxLng };
}

export async function countSearchResultWithEntity(
  client: AdminClient,
  query: AdminQuery,
  entityId: string
): PromiseResult<number, ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic>;
export async function countSearchResultWithEntity(
  client: PublishedClient,
  query: Query,
  entityId: string
): PromiseResult<number, ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic>;
export async function countSearchResultWithEntity(
  client: AdminClient | PublishedClient,
  query: AdminQuery | Query,
  entityId: string
): PromiseResult<number, ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic> {
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
