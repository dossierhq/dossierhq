import type { Paging } from '.';

export function isPagingForwards(paging?: Paging): boolean {
  if (!paging) {
    return true;
  }
  return paging.first !== undefined || paging.last === undefined;
}
