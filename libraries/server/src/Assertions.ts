import type { ErrorType, Result } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';

export function ensureRequired(
  parameters: Record<string, unknown>
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
