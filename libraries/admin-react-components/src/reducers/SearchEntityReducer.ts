import type {
  AdminEntity,
  AdminQuery,
  Connection,
  Edge,
  ErrorResult,
  ErrorType,
  Paging,
} from '@jonasb/datadata-core';

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
  return {
    query: initialQuery ?? {},
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
  UpdateResult: UpdateResultAction,
};
