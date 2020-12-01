import type { ErrorType, Result } from '.';
import { ok, notOk } from '.';

export type CursorNativeType = 'int' | 'string';

export interface PageInfo {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor: string;
  endCursor: string;
}

export interface Connection<T extends Edge<unknown, ErrorType>> {
  pageInfo: PageInfo;
  edges: T[];
}

export interface Edge<TOk, TError extends ErrorType> {
  node: Result<TOk, TError>;
  cursor: string;
}

export function toOpaqueCursor(type: CursorNativeType, value: unknown): string {
  switch (type) {
    case 'int':
      return Buffer.from(String(value as number)).toString('base64');
    case 'string':
      return Buffer.from(value as string).toString('base64');
    default:
      throw new Error(`Unknown cursor type ${type}`);
  }
}

export function fromOpaqueCursor(
  type: CursorNativeType,
  cursor: string
): Result<unknown, ErrorType.BadRequest> {
  switch (type) {
    case 'int': {
      const value = Number.parseInt(Buffer.from(cursor, 'base64').toString('ascii'));
      if (Number.isNaN(value)) {
        return notOk.BadRequest('Invalid format of cursor');
      }
      return ok(value);
    }
    case 'string': {
      const value = Buffer.from(cursor, 'base64').toString('ascii');
      return ok(value);
    }
    default:
      throw new Error(`Unknown cursor type ${type}`);
  }
}
