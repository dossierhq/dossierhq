import type { ErrorType, Result } from '.';

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

export function toOpaqueCursor(id: number): string {
  return Buffer.from(String(id)).toString('base64');
}

export function fromOpaqueCursor(cursor: string): number {
  return Number.parseInt(Buffer.from(cursor, 'base64').toString('ascii'));
}
