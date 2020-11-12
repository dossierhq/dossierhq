import type { Result } from '.';
import { ErrorType } from '.';
import { notOk, ok } from './ErrorResult';

export function ensureRequired(
  parameters: Record<string, unknown>
): Result<true, ErrorType.BadRequest> {
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
