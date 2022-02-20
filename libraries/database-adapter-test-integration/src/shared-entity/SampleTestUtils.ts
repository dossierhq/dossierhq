import type {
  AdminEntity,
  EntitySamplingPayload,
  ErrorType,
  PublishedEntity,
  Result,
} from '@jonasb/datadata-core';
import { AdminEntityStatus } from '@jonasb/datadata-core';
import { assertEquals, assertOkResult, assertTruthy } from '../Asserts';

export function countEntityStatuses(entities: AdminEntity[]): Record<AdminEntityStatus, number> {
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

export function assertSampledEntitiesArePartOfExpected<
  TEntity extends AdminEntity | PublishedEntity
>(actualResult: Result<EntitySamplingPayload<TEntity>, ErrorType>, expectedEntities: TEntity[]) {
  assertOkResult(actualResult);
  assertTruthy(actualResult.value.items.length > 0);

  const expectedIds = expectedEntities.map((it) => it.id);

  const missingEntities = actualResult.value.items.filter((it) => !expectedIds.includes(it.id));
  assertEquals(missingEntities, []);
}
