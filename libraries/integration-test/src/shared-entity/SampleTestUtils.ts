import type {
  Entity,
  EntityReference,
  EntitySamplingPayload,
  ErrorType,
  PublishedEntity,
  Result,
} from '@dossierhq/core';
import { EntityStatus } from '@dossierhq/core';
import { assertEquals, assertOkResult } from '../Asserts.js';
import type { AppEntity, AppPublishedEntity } from '../SchemaTypes.js';

export function countEntityStatuses(entities: AppEntity[]): Record<EntityStatus, number> {
  const result = {
    [EntityStatus.draft]: 0,
    [EntityStatus.published]: 0,
    [EntityStatus.modified]: 0,
    [EntityStatus.withdrawn]: 0,
    [EntityStatus.archived]: 0,
  };

  for (const entity of entities) {
    result[entity.info.status] += 1;
  }

  return result;
}

export function assertSampledEntities<
  TEntity extends AppEntity | AppPublishedEntity | EntityReference,
>(
  actualResult: Result<EntitySamplingPayload<AppEntity | AppPublishedEntity>, ErrorType>,
  expectedSeed: number,
  expectedEntities: TEntity[],
) {
  assertOkResult(actualResult);
  const { seed, totalCount, items } = actualResult.value;

  assertEquals(seed, expectedSeed);
  assertEquals(totalCount, expectedEntities.length);

  const actualIds = items.map((it) => it.id).sort();
  const expectedIds = expectedEntities.map((it) => it.id).sort();

  assertEquals(actualIds, expectedIds);
}

export function assertSampledEntitiesArePartOfExpected<
  TEntity extends Entity<string, object> | PublishedEntity<string, object>,
>(actualResult: Result<EntitySamplingPayload<TEntity>, ErrorType>, expectedEntities: TEntity[]) {
  assertOkResult(actualResult);

  const expectedIds = expectedEntities.map((it) => it.id);

  const missingEntities = actualResult.value.items.filter((it) => !expectedIds.includes(it.id));
  assertEquals(missingEntities, []);
}
