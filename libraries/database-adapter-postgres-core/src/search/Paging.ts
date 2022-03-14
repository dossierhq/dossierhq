import type { ErrorType, Paging, PagingInfo, Result } from '@jonasb/datadata-core';
import { getPagingInfo, ok } from '@jonasb/datadata-core';
import type { ResolvedPagingInfo } from '@jonasb/datadata-database-adapter';
import type { PostgresDatabaseAdapter } from '..';
import type { CursorNativeType } from './OpaqueCursor';
import { fromOpaqueCursor } from './OpaqueCursor';

//TODO move to server?
export const pagingDefaultCount = 25;

export interface ResolvedPagingCursors<TCursor> {
  before: TCursor | null;
  after: TCursor | null;
}

function getCursor(
  databaseAdapter: PostgresDatabaseAdapter,
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

export function resolvePaging(
  paging: Paging | undefined
): Result<ResolvedPagingInfo, ErrorType.BadRequest> {
  const result = getPagingInfo(paging);
  if (result.isError()) return result;
  return ok({ ...result.value, count: result.value.count ?? pagingDefaultCount });
}

export function resolvePagingCursors<TCursor>(
  databaseAdapter: PostgresDatabaseAdapter,
  cursorType: CursorNativeType,
  paging: PagingInfo
): Result<ResolvedPagingCursors<TCursor>, ErrorType.BadRequest> {
  const after = getCursor(databaseAdapter, cursorType, paging, 'after');
  const before = getCursor(databaseAdapter, cursorType, paging, 'before');

  if (after.isError()) return after;
  if (before.isError()) return before;

  return ok({
    before: before.value as TCursor | null,
    after: after.value as TCursor | null,
  });
}
