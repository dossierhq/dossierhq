import type {
  AdminEntity,
  AdminQuery,
  Connection,
  Edge,
  Entity,
  ErrorResult,
  ErrorType,
  Paging,
  Query,
} from '@jonasb/datadata-core';
import { AdminQueryOrder, getPagingInfo } from '@jonasb/datadata-core';
import isEqual from 'lodash/isEqual.js';
import type { Dispatch } from 'react';
import { useEffect } from 'react';

const defaultOrder = AdminQueryOrder.name;
const defaultPagingCount = 25;

export interface SearchEntityState {
  query: AdminQuery | Query;
  paging: Paging;
  pagingCount: number;
  text: string;

  connection: Connection<Edge<AdminEntity | Entity, ErrorType>> | null | undefined;
  connectionError: ErrorResult<unknown, ErrorType.BadRequest | ErrorType.Generic> | undefined;
  totalCount: number | null;
}

export interface SearchEntityStateAction {
  reduce(state: SearchEntityState): SearchEntityState;
}

export function initializeSearchEntityState(actions: SearchEntityStateAction[]): SearchEntityState {
  let state: SearchEntityState = {
    query: {},
    paging: {},
    pagingCount: defaultPagingCount,
    text: '',
    connection: undefined,
    connectionError: undefined,
    totalCount: null,
  };
  // Normalize query state
  state = reduceSearchEntityState(state, new SetQueryAction({}, true));
  for (const action of actions) {
    state = reduceSearchEntityState(state, action);
  }
  return state;
}

export function reduceSearchEntityState(
  state: SearchEntityState,
  action: SearchEntityStateAction
): SearchEntityState {
  const newState = action.reduce(state);
  return newState;
}

class SetTextAction implements SearchEntityStateAction {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  reduce(state: SearchEntityState): SearchEntityState {
    return {
      ...state,
      text: this.value,
      query: { ...state.query, text: this.value },
    };
  }
}

class SetPagingAction implements SearchEntityStateAction {
  value: Paging;

  constructor(value: Paging) {
    this.value = value;
  }

  reduce(state: SearchEntityState): SearchEntityState {
    if (isEqual(this.value, state.paging)) return state;
    const result = getPagingInfo(this.value);
    if (result.isError()) throw result.toError();
    return { ...state, paging: this.value, pagingCount: result.value.count || state.pagingCount };
  }
}

class SetQueryAction implements SearchEntityStateAction {
  readonly value: AdminQuery | Query;
  readonly partial: boolean;

  constructor(value: AdminQuery | Query, partial: boolean) {
    this.value = value;
    this.partial = partial;
  }

  reduce(state: SearchEntityState): SearchEntityState {
    const query: AdminQuery | Query = this.partial
      ? { ...state.query, ...this.value }
      : { ...this.value };
    if (!query.order) {
      query.order = defaultOrder;
    }
    if (query.entityTypes?.length === 0) {
      delete query.entityTypes;
    }
    if (query.text?.length === 0) {
      delete query.text;
    }
    if (isEqual(query, state.query)) {
      return state;
    }
    return { ...state, query, text: query.text ?? '' };
  }
}

class UpdateResultAction implements SearchEntityStateAction {
  connection: SearchEntityState['connection'];
  connectionError: SearchEntityState['connectionError'];

  constructor(
    connection: SearchEntityState['connection'],
    connectionError: SearchEntityState['connectionError']
  ) {
    this.connection = connection;
    this.connectionError = connectionError;
  }

  reduce(state: SearchEntityState): SearchEntityState {
    if (state.connection === this.connection && state.connectionError === this.connectionError) {
      return state;
    }
    return {
      ...state,
      connection: this.connection,
      connectionError: this.connectionError,
    };
  }
}

class UpdateTotalCountAction implements SearchEntityStateAction {
  totalCount: number | null;

  constructor(totalCount: number | null) {
    this.totalCount = totalCount;
  }

  reduce(state: SearchEntityState): SearchEntityState {
    if (state.totalCount === this.totalCount) {
      return state;
    }
    return {
      ...state,
      totalCount: this.totalCount,
    };
  }
}

export const SearchEntityStateActions = {
  SetText: SetTextAction,
  SetPaging: SetPagingAction,
  SetQuery: SetQueryAction,
  UpdateResult: UpdateResultAction,
  UpdateTotalCount: UpdateTotalCountAction,
};

export function getQueryWithoutDefaults(query: AdminQuery | Query): AdminQuery | Query {
  if (query.order === defaultOrder) {
    const { order, ...queryWithoutOrder } = query;
    return queryWithoutOrder;
  }
  return query;
}

export function useUpdateSearchEntityStateWithResponse(
  connection: Connection<Edge<AdminEntity | Entity, ErrorType>> | null | undefined,
  connectionError: ErrorResult<unknown, ErrorType.BadRequest | ErrorType.Generic> | undefined,
  totalCount: number | undefined,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.UpdateResult(connection, connectionError)
    );
  }, [connection, connectionError, dispatchSearchEntityState]);

  useEffect(() => {
    dispatchSearchEntityState(new SearchEntityStateActions.UpdateTotalCount(totalCount ?? null));
  }, [totalCount, dispatchSearchEntityState]);

  // useDebugLogChangedValues('useUpdateSearchEntityStateWithResponse changed values', { dispatchSearchEntityState, connection, connectionError, totalCount, });
}
