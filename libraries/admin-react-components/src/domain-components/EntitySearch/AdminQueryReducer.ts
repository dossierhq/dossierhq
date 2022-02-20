import type { AdminSearchQuery } from '@jonasb/datadata-core';

export interface AdminQueryState {
  resolvedQuery: AdminSearchQuery;
  text: string;
}

interface AdminQueryStateAction {
  reduce(state: AdminQueryState): AdminQueryState;
}

export function initializeAdminQueryState(query: AdminSearchQuery | undefined): AdminQueryState {
  return { resolvedQuery: query || {}, text: query?.text || '' };
}

export function reduceAdminQueryState(
  state: AdminQueryState,
  action: AdminQueryStateAction
): AdminQueryState {
  return action.reduce(state);
}

export class SetAdminQueryTextAction implements AdminQueryStateAction {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  reduce(state: AdminQueryState): AdminQueryState {
    return {
      ...state,
      text: this.value,
      resolvedQuery: { ...state.resolvedQuery, text: this.value },
    };
  }
}
