import type { AdminEntity, PublishedEntity } from '@dossierhq/core';
import { assert, expect } from 'vitest';

export function expectSampledEntitiesArePartOfExpected(
  actualResult: { seed: number; totalCount: number; items: { id: string }[] } | undefined,
  seed: number,
  expectedEntities: (AdminEntity | PublishedEntity)[],
) {
  expect(actualResult).toBeDefined();
  assert(actualResult);
  expect(actualResult.seed).toBe(seed);
  expect(actualResult.totalCount).toBe(expectedEntities.length);
  expect(actualResult.items.length).toBeGreaterThan(0);

  const expectedIds = expectedEntities.map((it) => it.id);

  const missingEntities = actualResult.items.filter((it) => !expectedIds.includes(it.id));
  expect(missingEntities).toEqual([]);
}
