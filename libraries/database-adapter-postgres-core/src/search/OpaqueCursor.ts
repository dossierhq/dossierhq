import type { ErrorType, Result } from '@dossierhq/core';
import { assertExhaustive, notOk, ok } from '@dossierhq/core';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';

export type CursorNativeType = 'int' | 'string';

export function toOpaqueCursor(
  databaseAdapter: PostgresDatabaseAdapter,
  type: CursorNativeType,
  value: unknown
): string {
  switch (type) {
    case 'int':
      return databaseAdapter.base64Encode(String(value as number));
    case 'string':
      return databaseAdapter.base64Encode(value as string);
    default:
      assertExhaustive(type);
  }
}

export function fromOpaqueCursor(
  databaseAdapter: PostgresDatabaseAdapter,
  type: CursorNativeType,
  cursor: string
): Result<unknown, typeof ErrorType.BadRequest> {
  switch (type) {
    case 'int': {
      const decoded = databaseAdapter.base64Decode(cursor);
      const value = Number.parseInt(decoded);
      if (Number.isNaN(value)) {
        return notOk.BadRequest('Invalid format of cursor');
      }
      return ok(value);
    }
    case 'string': {
      const value = databaseAdapter.base64Decode(cursor);
      return ok(value);
    }
    default:
      assertExhaustive(type);
  }
}
