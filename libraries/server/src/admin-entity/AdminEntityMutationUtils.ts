import {
  getEntityNameBase,
  notOk,
  ok,
  type EntityReference,
  type ErrorType,
  type Result,
} from '@dossierhq/core';

export function randomNameGenerator(name: string) {
  const nameBase = getEntityNameBase(name);
  return `${nameBase}#${Math.random().toFixed(8).slice(2)}`;
}

export function checkUUIDsAreUnique(
  references: EntityReference[],
): Result<void, typeof ErrorType.BadRequest> {
  const unique = new Set<string>();
  for (const { id } of references) {
    if (unique.has(id)) {
      return notOk.BadRequest(`Duplicate ids: ${id}`);
    }
    unique.add(id);
  }
  return ok(undefined);
}
