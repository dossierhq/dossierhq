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
  const query = initialQuery ?? {};
  if (!query.order) {
    query.order = defaultOrder;
  }
  return {
    query,
    paging: {},
    pagingCount: defaultPagingCount,
    text: initialQuery?.text ?? '',
    connection: undefined,
    connectionError: undefined,
  };
}

export function reduceSearchEntityState(
  state: SearchEntityState,
  action: SearchEntityStateAction
): SearchEntityState {
  return action.reduce(state);
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
