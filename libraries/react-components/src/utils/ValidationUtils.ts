import type { PublishValidationError, SaveValidationError } from '@dossierhq/core';

type ValidationError = SaveValidationError | PublishValidationError;

export function groupValidationErrorsByTopLevelPath(errors: ValidationError[]): {
  root: ValidationError[];
  children: Map<number | string, ValidationError[]>;
} {
  const root: ValidationError[] = [];
  const children = new Map<number | string, ValidationError[]>();
  for (const error of errors) {
    if (error.path.length === 0) {
      root.push(error);
    } else {
      const [topLevel, ...rest] = error.path;
      const newError = { ...error, path: rest };

      const existingErrors = children.get(topLevel);
      if (existingErrors) {
        existingErrors.push(newError);
      } else {
        children.set(topLevel, [newError]);
      }
    }
  }
  return { root, children };
}
