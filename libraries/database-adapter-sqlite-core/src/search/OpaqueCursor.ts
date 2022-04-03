import type { ErrorType, Result } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { Database } from '../QueryFunctions';

export type CursorNativeType = 'int' | 'string';

export function toOpaqueCursor(database: Database, type: CursorNativeType, value: unknown): string {
  switch (type) {
    case 'int':
      return database.adapter.encodeCursor(String(value as number));
    case 'string':
      return database.adapter.encodeCursor(value as string);
    default:
      throw new Error(`Unknown cursor type ${type}`);
  }
}

export function fromOpaqueCursor(
  database: Database,
  type: CursorNativeType,
  cursor: string
): Result<unknown, ErrorType.BadRequest> {
  switch (type) {
    case 'int': {
      const decoded = database.adapter.decodeCursor(cursor);
      const value = Number.parseInt(decoded);
      if (Number.isNaN(value)) {
        return notOk.BadRequest('Invalid format of cursor');
      }
      return ok(value);
    }
    case 'string': {
      const value = database.adapter.decodeCursor(cursor);
      return ok(value);
    }
    default:
      throw new Error(`Unknown cursor type ${type}`);
  }
}
