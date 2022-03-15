import type { ErrorType, PagingInfo, Result } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { SqliteDatabaseAdapter } from '..';
import type { CursorNativeType } from './OpaqueCursor';
import { fromOpaqueCursor } from './OpaqueCursor';

export interface ResolvedPagingCursors<TCursor> {
  before: TCursor | null;
  after: TCursor | null;
}

function getCursor(
  databaseAdapter: SqliteDatabaseAdapter,
  cursorType: CursorNativeType,
  paging: PagingInfo,
  key: 'after' | 'before'
): Result<unknown, ErrorType.BadRequest> {
  const cursor = paging[key];
  if (cursor) {
    return fromOpaqueCursor(databaseAdapter, cursorType, cursor);
  }
  return ok(null);
}

export function resolvePagingCursors<TCursor>(
  databaseAdapter: SqliteDatabaseAdapter,
  cursorType: CursorNativeType,
  paging: PagingInfo
): Result<ResolvedPagingCursors<TCursor>, ErrorType.BadRequest> {
  const after = getCursor(databaseAdapter, cursorType, paging, 'after');
  const before = getCursor(databaseAdapter, cursorType, paging, 'before');

  if (after.isError()) return after;
  if (before.isError()) return before;

  return ok({
    before: before.value as TCursor,
    after: after.value as TCursor,
  });
}
