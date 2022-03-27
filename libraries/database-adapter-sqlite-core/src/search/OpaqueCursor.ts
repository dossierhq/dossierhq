import type { ErrorType, Result } from '@jonasb/datadata-core';
import { ok, notOk } from '@jonasb/datadata-core';
import type { SqliteDatabaseAdapter } from '..';

export type CursorNativeType = 'int' | 'string';

export function toOpaqueCursor(
  databaseAdapter: SqliteDatabaseAdapter,
  type: CursorNativeType,
  value: unknown
): string {
  switch (type) {
    case 'int':
      return databaseAdapter.encodeCursor(String(value as number));
    case 'string':
      return databaseAdapter.encodeCursor(value as string);
    default:
      throw new Error(`Unknown cursor type ${type}`);
  }
}

export function fromOpaqueCursor(
  databaseAdapter: SqliteDatabaseAdapter,
  type: CursorNativeType,
  cursor: string
): Result<unknown, ErrorType.BadRequest> {
  switch (type) {
    case 'int': {
      const decoded = databaseAdapter.decodeCursor(cursor);
      const value = Number.parseInt(decoded);
      if (Number.isNaN(value)) {
        return notOk.BadRequest('Invalid format of cursor');
      }
      return ok(value);
    }
    case 'string': {
      const value = databaseAdapter.decodeCursor(cursor);
      return ok(value);
    }
    default:
      throw new Error(`Unknown cursor type ${type}`);
  }
}
