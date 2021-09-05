import type { UniqueConstraint } from './DatabaseSchema';

export function isUniqueViolationOfConstraint<T>(
  error: unknown,
  constraint: UniqueConstraint
): boolean {
  if (error instanceof Error) {
    const qualifiedColumns = constraint.columns.map((column) => `${constraint.table}.${column}`);
    const expectedMessage = `UNIQUE constraint failed: ${qualifiedColumns.join(', ')}`;
    return error.message === expectedMessage;
  }
  return false;
}
