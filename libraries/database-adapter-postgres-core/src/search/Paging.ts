import type { ErrorType, Paging, Result } from '@jonasb/datadata-core';
import { getPagingInfo, ok } from '@jonasb/datadata-core';
import type { PostgresDatabaseAdapter } from '..';
import type { CursorNativeType } from './OpaqueCursor';
import { fromOpaqueCursor } from './OpaqueCursor';

//TODO move to server?
export const pagingDefaultCount = 25;

export interface ResolvedPaging {
  forwards: boolean;
  count: number;
  before: string | null;
  after: string | null;
}

export interface ResolvedPagingCursors<TCursor> {
  before: TCursor | null;
  after: TCursor | null;
}

function getCursor(
  databaseAdapter: PostgresDatabaseAdapter,
  cursorType: CursorNativeType,
  paging: ResolvedPaging,
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
): Result<ResolvedPaging, ErrorType.BadRequest> {
  const pagingInfo = getPagingInfo(paging);
  if (pagingInfo.isError()) return pagingInfo;

  const { forwards, count } = pagingInfo.value;
  return ok({
    forwards,
    count: count ?? pagingDefaultCount,
    before: paging?.before ?? null,
    after: paging?.after ?? null,
  });
}

export function resolvePagingCursors<TCursor>(
  databaseAdapter: PostgresDatabaseAdapter,
  cursorType: CursorNativeType,
  paging: ResolvedPaging
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
