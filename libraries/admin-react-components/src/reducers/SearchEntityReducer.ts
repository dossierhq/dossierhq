import type {
  AdminEntity,
  AdminQuery,
  Connection,
  Edge,
  ErrorResult,
  ErrorType,
  Paging,
} from '@jonasb/datadata-core';
import { QueryOrder } from '@jonasb/datadata-core';
import isEqual from 'lodash/isEqual';

const defaultOrder = QueryOrder.name;
const defaultPagingCount = 25;

export interface SearchEntityState {
  query: AdminQuery;
  paging: Paging;
  pagingCount: number;
  text: string;

  connection: Connection<Edge<AdminEntity, ErrorType>> | null | undefined;
  connectionError: ErrorResult<unknown, ErrorType.BadRequest | ErrorType.Generic> | undefined;
}

export interface SearchEntityStateAction {
  reduce(state: SearchEntityState): SearchEntityState;
}

export function initializeSearchEntityState(
  initialQuery: AdminQuery | undefined
): SearchEntityState {
  let state: SearchEntityState = {
    query: {},
    paging: {},
    pagingCount: defaultPagingCount,
    text: initialQuery?.text ?? '',
    connection: undefined,
    connectionError: undefined,
  };
  // Normalize query state
  state = new SetQueryAction(initialQuery ?? {}).reduce(state);
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
    return { ...state, paging: this.value };
  }
}

class SetQueryAction implements SearchEntityStateAction {
  value: AdminQuery;

  constructor(value: AdminQuery) {
    this.value = value;
  }

  reduce(state: SearchEntityState): SearchEntityState {
    const query = { ...state.query, ...this.value };
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
    return { ...state, query };
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

export const SearchEntityStateActions = {
  SetText: SetTextAction,
  SetPaging: SetPagingAction,
  SetQuery: SetQueryAction,
  UpdateResult: UpdateResultAction,
};
