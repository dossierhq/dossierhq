import type {
  AdminEntity,
  AdminSearchQuery,
  Connection,
  Edge,
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorResult,
  ErrorType,
  Paging,
  PublishedEntity,
  PublishedQueryOrder,
  PublishedSearchQuery,
} from '@jonasb/datadata-core';
import { AdminQueryOrder, getPagingInfo } from '@jonasb/datadata-core';
import isEqual from 'lodash/isEqual';

const defaultOrder: AdminQueryOrder | PublishedQueryOrder = AdminQueryOrder.name;
const defaultRequestedCount = 25;

export interface SearchEntityState {
  query: AdminSearchQuery | PublishedSearchQuery;
  paging: Paging | undefined;
  sampling: EntitySamplingOptions | undefined;
  requestedCount: number;
  text: string;

  connection: Connection<Edge<AdminEntity | PublishedEntity, ErrorType>> | null | undefined;
  connectionError: ErrorResult<unknown, ErrorType.BadRequest | ErrorType.Generic> | undefined;
  entitySamples: EntitySamplingPayload<AdminEntity | PublishedEntity> | undefined;
  entitySamplesError: ErrorResult<unknown, ErrorType.BadRequest | ErrorType.Generic> | undefined;
  totalCount: number | null;
}

export interface SearchEntityStateAction {
  reduce(state: SearchEntityState): SearchEntityState;
}

export function initializeSearchEntityState(actions: SearchEntityStateAction[]): SearchEntityState {
  let state: SearchEntityState = {
    query: {},
    paging: {},
    sampling: undefined,
    requestedCount: defaultRequestedCount,
    text: '',
    connection: undefined,
    connectionError: undefined,
    entitySamples: undefined,
    entitySamplesError: undefined,
    totalCount: null,
  };
  // Normalize query state
  state = reduceSearchEntityState(
    state,
    new SetQueryAction({}, { partial: true, resetPaging: false })
  );
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
    if (isEqual(this.value, state.paging)) {
      return state;
    }
    const result = getPagingInfo(this.value);
    if (result.isError()) throw result.toError();
    return {
      ...state,
      paging: this.value,
      sampling: undefined,
      requestedCount: result.value.count || state.requestedCount,
    };
  }
}

class SetSamplingAction implements SearchEntityStateAction {
  readonly value: EntitySamplingOptions;
  readonly partial: boolean;

  constructor(value: EntitySamplingOptions, partial: boolean) {
    this.value = value;
    this.partial = partial;
  }

  reduce(state: SearchEntityState): SearchEntityState {
    const sampling = this.partial ? { ...state.sampling, ...this.value } : { ...this.value };
    if (sampling.seed === undefined) {
      sampling.seed = Math.floor(Math.random() * 999999);
    }

    const query = { ...state.query };
    delete query.order;
    delete query.reverse;

    if (isEqual(sampling, state.sampling) && isEqual(query, state.query)) {
      return state;
    }

    return {
      ...state,
      sampling,
      query,
      paging: undefined,
      requestedCount: sampling.count || state.requestedCount,
    };
  }
}

class SetQueryAction implements SearchEntityStateAction {
  readonly value: AdminSearchQuery | PublishedSearchQuery;
  readonly partial: boolean;
  readonly resetPaging: boolean;

  constructor(
    value: AdminSearchQuery | PublishedSearchQuery,
    { partial, resetPaging }: { partial: boolean; resetPaging: boolean }
  ) {
    this.value = value;
    this.partial = partial;
    this.resetPaging = resetPaging;
  }

  reduce(state: SearchEntityState): SearchEntityState {
    const query: AdminSearchQuery | PublishedSearchQuery = this.partial
      ? { ...state.query, ...this.value }
      : { ...this.value };

    let paging = this.resetPaging ? {} : state.paging;

    // Sampling/paging
    const switchToSearch = (this.value.order || this.value.reverse !== undefined) && state.sampling;
    let sampling = state.sampling;
    if (switchToSearch) {
      sampling = undefined;
      paging = {};
    }

    // Normalize (except for order/reverse)
    if (query.authKeys?.length === 0) {
      delete query.authKeys;
    }
    if (query.entityTypes?.length === 0) {
      delete query.entityTypes;
    }
    if ('status' in query && query.status?.length === 0) {
      delete query.status;
    }
    if (query.text?.length === 0) {
      delete query.text;
    }

    if (paging) {
      if (!query.order) {
        query.order = defaultOrder;
      }
    } else {
      delete query.order;
      delete query.reverse;
    }

    if (
      isEqual(
        { query, paging, sampling },
        { query: state.query, paging: state.paging, sampling: state.sampling }
      )
    ) {
      return state;
    }
    return { ...state, query, text: query.text ?? '', paging, sampling };
  }
}

class UpdateSearchResultAction implements SearchEntityStateAction {
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

class UpdateSampleResultAction implements SearchEntityStateAction {
  entitySamples: SearchEntityState['entitySamples'];
  entitySamplesError: SearchEntityState['entitySamplesError'];

  constructor(
    entitySamples: SearchEntityState['entitySamples'],
    entitySamplesError: SearchEntityState['entitySamplesError']
  ) {
    this.entitySamples = entitySamples;
    this.entitySamplesError = entitySamplesError;
  }

  reduce(state: SearchEntityState): SearchEntityState {
    if (
      state.entitySamples === this.entitySamples &&
      state.entitySamplesError === this.entitySamplesError
    ) {
      return state;
    }
    return {
      ...state,
      entitySamples: this.entitySamples,
      entitySamplesError: this.entitySamplesError,
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
  SetSampling: SetSamplingAction,
  SetQuery: SetQueryAction,
  UpdateSearchResult: UpdateSearchResultAction,
  UpdateSampleResult: UpdateSampleResultAction,
  UpdateTotalCount: UpdateTotalCountAction,
};

export function getQueryWithoutDefaults(
  query: AdminSearchQuery | PublishedSearchQuery
): AdminSearchQuery | PublishedSearchQuery {
  let changed = false;
  const newQuery = { ...query };
  if (query.order === defaultOrder) {
    delete newQuery.order;
    changed = true;
  }
  if (query.reverse === false) {
    delete newQuery.reverse;
    changed = true;
  }
  return changed ? newQuery : query;
}
