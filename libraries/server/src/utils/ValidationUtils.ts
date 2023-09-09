import { notOk, ok, type EntityReference, type UniqueIndexReference } from '@dossierhq/core';

export function validateEntityReference(reference: UniqueIndexReference | EntityReference) {
  if ('index' in reference) {
    if (typeof reference.index !== 'string') {
      return notOk.BadRequest(
        `reference: Invalid index (got: ${typeof reference.index}, must be string)`,
      );
    }
    if (typeof reference.value !== 'string') {
      return notOk.BadRequest(
        `reference: Invalid value (got: ${typeof reference.value}, must be string)`,
      );
    }
  }
  return ok(undefined);
}
