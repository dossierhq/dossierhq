import type { ValidationError } from '@jonasb/datadata-core';

export function groupValidationErrorsByTopLevelPath(
  errors: ValidationError[]
): Map<number | string, ValidationError[]> {
  const result = new Map<number | string, ValidationError[]>();
  for (const error of errors) {
    const [topLevel, ...rest] = error.path;
    const newError = { ...error, path: rest };

    const existingErrors = result.get(topLevel);
    if (existingErrors) {
      existingErrors.push(newError);
    } else {
      result.set(topLevel, [newError]);
    }
  }
  return result;
}
