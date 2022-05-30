import type { EntityReference, ErrorType, Result } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';

export function randomNameGenerator(name: string) {
  return `${name}#${Math.random().toFixed(8).slice(2)}`;
}

export function checkUUIDsAreUnique(
  references: EntityReference[]
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
