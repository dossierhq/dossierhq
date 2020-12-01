import { ErrorType, notOk, ok } from './';
import type { Result } from './';
import { fromOpaqueCursor } from './Connection';
import type { CursorNativeType } from './Connection';
import { pagingDefaultCount } from './Constants';

export type Paging = { first?: number; after?: string; last?: number; before?: string };

export interface ResolvedPaging<TCursor> {
  isForwards: boolean;
  count: number;
  before: TCursor | null;
  after: TCursor | null;
}

export function isPagingForwards(paging?: Paging): boolean {
  return getCount(paging, 'first') !== null || getCount(paging, 'last') === null;
}

function getCount(paging: Paging | undefined, key: 'first' | 'last') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const count = (paging as any)?.[key];
  return typeof count === 'number' ? count : null;
}

function getCursor(
  cursorType: CursorNativeType,
  paging: Paging | undefined,
  key: 'after' | 'before'
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cursor = (paging as any)?.[key];
  if (cursor) {
    return fromOpaqueCursor(cursorType, cursor);
  }
  return null;
}

export function resolvePaging<TCursor>(
  cursorType: CursorNativeType,
  paging?: Paging
): Result<ResolvedPaging<TCursor>, ErrorType.BadRequest> {
  const first = getCount(paging, 'first');
  const last = getCount(paging, 'last');
  const after = getCursor(cursorType, paging, 'after');
  const before = getCursor(cursorType, paging, 'before');

  if (first !== null && first < 0) {
    return notOk.BadRequest('Paging first is a negative value');
  }
  if (last !== null && last < 0) {
    return notOk.BadRequest('Paging last is a negative value');
  }
  if (first !== null && last !== null) {
    // Valid in spec but discouraged. How to implement?
    return notOk.BadRequest('Both first and last are defined for paging, which is not supported');
  }

  if (after?.isError()) {
    return after;
  }
  if (before?.isError()) {
    return before;
  }

  const isForwards = isPagingForwards(paging);
  const count = (isForwards ? first : last) ?? pagingDefaultCount;

  return ok({
    isForwards,
    count,
    before: before?.isOk() ? (before.value as TCursor) : null,
    after: after?.isOk() ? (after.value as TCursor) : null,
  });
}
