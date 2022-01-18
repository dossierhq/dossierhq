import type { ErrorType, Paging, Result } from '@jonasb/datadata-core';
import { getPagingInfo, ok } from '@jonasb/datadata-core';
import type { SqliteDatabaseAdapter } from '..';
import type { CursorNativeType } from './OpaqueCursor';
import { fromOpaqueCursor } from './OpaqueCursor';

export const pagingDefaultCount = 25;

export interface ResolvedPaging<TCursor> {
  forwards: boolean;
  count: number;
  before: TCursor | null;
  after: TCursor | null;
}

function getCursor(
  databaseAdapter: SqliteDatabaseAdapter,
  cursorType: CursorNativeType,
  paging: Paging | undefined,
  key: 'after' | 'before'
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cursor = (paging as any)?.[key];
  if (cursor) {
    return fromOpaqueCursor(databaseAdapter, cursorType, cursor);
  }
  return null;
}

export function resolvePaging<TCursor>(
  databaseAdapter: SqliteDatabaseAdapter,
  cursorType: CursorNativeType,
  paging?: Paging
): Result<ResolvedPaging<TCursor>, ErrorType.BadRequest> {
  const after = getCursor(databaseAdapter, cursorType, paging, 'after');
  const before = getCursor(databaseAdapter, cursorType, paging, 'before');

  if (after?.isError()) {
    return after;
  }
  if (before?.isError()) {
    return before;
  }

  const pagingInfo = getPagingInfo(paging);
  if (pagingInfo.isError()) {
    return pagingInfo;
  }
  const { forwards, count } = pagingInfo.value;

  return ok({
    forwards,
    count: count ?? pagingDefaultCount,
    before: before?.isOk() ? (before.value as TCursor) : null,
    after: after?.isOk() ? (after.value as TCursor) : null,
  });
}
