import { fromOpaqueCursor } from './Connection';
import { pagingDefaultCount } from './Constants';

export type Paging = { first?: number; after?: string } | { last?: number; before?: string };
export interface ResolvedPaging {
  isFirst: boolean;
  cursor: number | null;
  count: number;
}

function getCount(paging: Paging | undefined, key: 'first' | 'last') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const count = (paging as any)?.[key];
  return typeof count === 'number' ? count : pagingDefaultCount;
}

function getCursor(paging: Paging | undefined, key: 'after' | 'before') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cursor = (paging as any)?.[key];
  if (cursor) {
    return fromOpaqueCursor(cursor);
  }
  return null;
}

export function resolvePaging(paging?: Paging): ResolvedPaging {
  const isFirst =
    !paging || 'first' in paging || 'after' in paging || !('last' in paging || 'before' in paging);
  return {
    isFirst,
    count: getCount(paging, isFirst ? 'first' : 'last'),
    cursor: getCursor(paging, isFirst ? 'after' : 'before'),
  };
}
