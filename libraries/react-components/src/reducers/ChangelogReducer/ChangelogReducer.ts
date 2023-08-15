import {
  getPagingInfo,
  type ChangelogEvent,
  type ChangelogQuery,
  type Connection,
  type Edge,
  type ErrorResult,
  type ErrorType,
  type Paging,
} from '@dossierhq/core';
import isEqual from 'lodash/isEqual.js';

const DEFAULT_VALUES = {
  reverse: true,
  requestedCount: 25,
} as const;

export interface ChangelogState {
  query: ChangelogQuery;
  paging: Paging | undefined;
  requestedCount: number;

  connection: Connection<Edge<ChangelogEvent, ErrorType>> | null | undefined;
  connectionError:
    | ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>
    | undefined;
  totalCount: number | null;

  // null until first loaded
  edges: Edge<ChangelogEvent, ErrorType>[] | null;
  loadingState: '' | 'next-page' | 'prev-page' | 'first-page' | 'last-page';
  scrollToTopSignal: number;
}

export interface ChangelogStateAction {
  reduce(state: Readonly<ChangelogState>): Readonly<ChangelogState>;
}

export function initializeChangelogState({
  actions,
}: {
  actions?: ChangelogStateAction[];
}): ChangelogState {
  let state: ChangelogState = {
    query: {},
    paging: {},
    requestedCount: DEFAULT_VALUES.requestedCount,
    connection: undefined,
    connectionError: undefined,
    totalCount: null,
    edges: null,
    loadingState: '',
    scrollToTopSignal: 0,
  };
  // Normalize query state
  state = reduceChangelogState(
    state,
    new SetQueryAction({}, { partial: true, resetPagingIfModifying: false }),
  );
  if (actions) {
    for (const action of actions) {
      state = reduceChangelogState(state, action);
    }
  }
  return state;
}

export function reduceChangelogState(
  state: Readonly<ChangelogState>,
  action: ChangelogStateAction,
): Readonly<ChangelogState> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

class SetPagingAction implements ChangelogStateAction {
  paging: Paging;
  pagingCause: 'first-page' | 'prev-page' | 'next-page' | 'last-page' | undefined;

  constructor(
    paging: Paging,
    pagingCause?: 'first-page' | 'prev-page' | 'next-page' | 'last-page',
  ) {
    this.paging = paging;
    this.pagingCause = pagingCause;
  }

  reduce(state: Readonly<ChangelogState>): Readonly<ChangelogState> {
    if (isEqual(this.paging, state.paging)) {
      return state;
    }
    const { count } = getPagingInfo(this.paging).valueOrThrow();
    return {
      ...state,
      paging: this.paging,
      requestedCount: count || state.requestedCount,
      loadingState: this.pagingCause ?? '',
    };
  }
}

class SetQueryAction implements ChangelogStateAction {
  readonly value: ChangelogQuery;
  readonly partial: boolean;
  readonly resetPagingIfModifying: boolean;

  constructor(
    value: ChangelogQuery,
    { partial, resetPagingIfModifying }: { partial: boolean; resetPagingIfModifying: boolean },
  ) {
    this.value = value;
    this.partial = partial;
    this.resetPagingIfModifying = resetPagingIfModifying;
  }

  reduce(state: Readonly<ChangelogState>): Readonly<ChangelogState> {
    const query: ChangelogQuery = this.partial
      ? { ...state.query, ...this.value }
      : { ...this.value };

    if (isEqual(query, state.query)) {
      return state;
    }

    let { paging, loadingState } = state;

    if (this.resetPagingIfModifying) {
      paging = {};
      loadingState = 'first-page';
    }
    return { ...state, query, paging, loadingState };
  }
}

class UpdateSearchResultAction implements ChangelogStateAction {
  connection: ChangelogState['connection'];
  connectionError: ChangelogState['connectionError'];

  constructor(
    connection: ChangelogState['connection'],
    connectionError: ChangelogState['connectionError'],
  ) {
    this.connection = connection;
    this.connectionError = connectionError;
  }

  reduce(state: Readonly<ChangelogState>): Readonly<ChangelogState> {
    if (state.connection === this.connection && state.connectionError === this.connectionError) {
      return state;
    }
    let { edges, scrollToTopSignal, loadingState } = state;
    if (this.connection !== undefined) {
      edges = this.connection === null ? [] : this.connection.edges;
      if (['first-page', 'prev-page', 'next-page', 'last-page'].includes(loadingState)) {
        scrollToTopSignal += 1;
        loadingState = '';
      }
    }
    return {
      ...state,
      connection: this.connection,
      connectionError: this.connectionError,
      edges,
      scrollToTopSignal,
      loadingState,
    };
  }
}

class UpdateTotalCountAction implements ChangelogStateAction {
  totalCount: number | null;

  constructor(totalCount: number | null) {
    this.totalCount = totalCount;
  }

  reduce(state: Readonly<ChangelogState>): Readonly<ChangelogState> {
    if (state.totalCount === this.totalCount) {
      return state;
    }
    return {
      ...state,
      totalCount: this.totalCount,
    };
  }
}

export const ChangelogStateActions = {
  SetPaging: SetPagingAction,
  SetQuery: SetQueryAction,
  UpdateSearchResult: UpdateSearchResultAction,
  UpdateTotalCount: UpdateTotalCountAction,
};

export function getQueryWithoutDefaults(query: ChangelogQuery): ChangelogQuery {
  let changed = false;
  const newQuery = { ...query };
  if (query.reverse === DEFAULT_VALUES.reverse) {
    delete newQuery.reverse;
    changed = true;
  }
  return changed ? newQuery : query;
}
