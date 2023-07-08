import type { ErrorType, Result } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import type { DatabasePagingInfo } from '@dossierhq/database-adapter';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import type { CursorNativeType } from './OpaqueCursor.js';
import { fromOpaqueCursor } from './OpaqueCursor.js';

export interface ResolvedPagingCursors<TCursor> {
  before: TCursor | null;
  after: TCursor | null;
}

function getCursor(
  databaseAdapter: PostgresDatabaseAdapter,
  cursorType: CursorNativeType,
  paging: DatabasePagingInfo,
  key: 'after' | 'before',
): Result<unknown, typeof ErrorType.BadRequest> {
  const cursor = paging[key];
  if (cursor) {
    return fromOpaqueCursor(databaseAdapter, cursorType, cursor);
  }
  return ok(null);
}

export function resolvePagingCursors<TCursor>(
  databaseAdapter: PostgresDatabaseAdapter,
  cursorType: CursorNativeType,
  paging: DatabasePagingInfo,
): Result<ResolvedPagingCursors<TCursor>, typeof ErrorType.BadRequest> {
  const after = getCursor(databaseAdapter, cursorType, paging, 'after');
  const before = getCursor(databaseAdapter, cursorType, paging, 'before');

  if (after.isError()) return after;
  if (before.isError()) return before;

  return ok({
    before: before.value as TCursor,
    after: after.value as TCursor,
  });
}
