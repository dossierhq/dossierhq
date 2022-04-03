import type { ErrorType, Result } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { DatabasePagingInfo } from '@jonasb/datadata-database-adapter';
import type { Database } from '../QueryFunctions';
import type { CursorNativeType } from './OpaqueCursor';
import { fromOpaqueCursor } from './OpaqueCursor';

export interface ResolvedPagingCursors<TCursor> {
  before: TCursor | null;
  after: TCursor | null;
}

function getCursor(
  database: Database,
  cursorType: CursorNativeType,
  paging: DatabasePagingInfo,
  key: 'after' | 'before'
): Result<unknown, ErrorType.BadRequest> {
  const cursor = paging[key];
  if (cursor) {
    return fromOpaqueCursor(database, cursorType, cursor);
  }
  return ok(null);
}

export function resolvePagingCursors<TCursor>(
  database: Database,
  cursorType: CursorNativeType,
  paging: DatabasePagingInfo
): Result<ResolvedPagingCursors<TCursor>, ErrorType.BadRequest> {
  const after = getCursor(database, cursorType, paging, 'after');
  const before = getCursor(database, cursorType, paging, 'before');

  if (after.isError()) return after;
  if (before.isError()) return before;

  return ok({
    before: before.value as TCursor,
    after: after.value as TCursor,
  });
}
