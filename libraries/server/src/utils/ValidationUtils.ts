import {
  notOk,
  ok,
  type EntityReference,
  type ErrorType,
  type Result,
  type UniqueIndexReference,
} from '@dossierhq/core';

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

export function ensureRequired(
  parameters: Record<string, unknown>,
): Result<true, typeof ErrorType.BadRequest> {
  const missing: string[] = [];
  for (const [parameter, value] of Object.entries(parameters)) {
    if (!value) {
      missing.push(parameter);
    }
  }
  if (missing.length === 0) {
    return ok(true);
  }
  return notOk.BadRequest(`Missing ${missing.join(', ')}`);
}
