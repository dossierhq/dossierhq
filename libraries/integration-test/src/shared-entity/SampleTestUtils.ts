import type {
  AdminEntity,
  EntityReference,
  EntitySamplingPayload,
  ErrorType,
  PublishedEntity,
  Result,
} from '@dossierhq/core';
import { AdminEntityStatus } from '@dossierhq/core';
import { assertEquals, assertOkResult, assertTruthy } from '../Asserts.js';
import type { AppAdminEntity, AppPublishedEntity } from '../SchemaTypes.js';

export function countEntityStatuses(entities: AppAdminEntity[]): Record<AdminEntityStatus, number> {
  const result = {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    [AdminEntityStatus.archived]: 0,
  };

  for (const entity of entities) {
    result[entity.info.status] += 1;
  }

  return result;
}

export function assertSampledEntities<
  TEntity extends AppAdminEntity | AppPublishedEntity | EntityReference,
>(
  actualResult: Result<EntitySamplingPayload<AppAdminEntity | AppPublishedEntity>, ErrorType>,
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
  TEntity extends AdminEntity<string, object> | PublishedEntity<string, object>,
>(actualResult: Result<EntitySamplingPayload<TEntity>, ErrorType>, expectedEntities: TEntity[]) {
  assertOkResult(actualResult);
  assertTruthy(actualResult.value.items.length > 0);

  const expectedIds = expectedEntities.map((it) => it.id);

  const missingEntities = actualResult.value.items.filter((it) => !expectedIds.includes(it.id));
  assertEquals(missingEntities, []);
}
