import type {
  AdminEntity,
  AdminSearchQuery,
  Connection,
  Edge,
  EntityReference,
  EntitySamplingOptions,
  EntitySamplingPayload,
  ErrorResult,
  ErrorType,
  Paging,
  PublishedEntity,
  PublishedQueryOrder,
  PublishedSearchQuery,
  Result,
} from '@jonasb/datadata-core';
import { AdminQueryOrder, getPagingInfo, ok } from '@jonasb/datadata-core';
import isEqual from 'lodash/isEqual.js';

const defaultOrder: AdminQueryOrder | PublishedQueryOrder = AdminQueryOrder.name;
const defaultRequestedCount = 25;

export interface SearchEntityState {
  restrictEntityTypes: string[];
  restrictLinksFrom: EntityReference | null;
  restrictLinksTo: EntityReference | null;

  query: AdminSearchQuery | PublishedSearchQuery;
  paging: Paging | undefined;
  sampling: EntitySamplingOptions | undefined;
  requestedCount: number;
  text: string;

  connection: Connection<Edge<AdminEntity | PublishedEntity, ErrorType>> | null | undefined;
  connectionError:
    | ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>
    | undefined;
  entitySamples: EntitySamplingPayload<AdminEntity | PublishedEntity> | undefined;
  entitySamplesError:
    | ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>
    | undefined;
  totalCount: number | null;

  // null until first loaded
  entities: Result<AdminEntity | PublishedEntity, ErrorType>[] | null;
  loadingState: '' | 'sample' | 'next-page' | 'prev-page' | 'first-page' | 'last-page';
  entitiesScrollToTopSignal: number;
}

export interface SearchEntityStateAction {
  reduce(state: Readonly<SearchEntityState>): Readonly<SearchEntityState>;
}

export function initializeSearchEntityState({
  actions,
  restrictEntityTypes,
  restrictLinksFrom,
  restrictLinksTo,
}: {
  actions?: SearchEntityStateAction[];
  restrictEntityTypes?: string[];
  restrictLinksFrom?: EntityReference;
  restrictLinksTo?: EntityReference;
}): SearchEntityState {
  let state: SearchEntityState = {
    restrictEntityTypes: restrictEntityTypes ?? [],
    restrictLinksFrom: restrictLinksFrom ?? null,
    restrictLinksTo: restrictLinksTo ?? null,
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
    entities: null,
    loadingState: '',
    entitiesScrollToTopSignal: 0,
  };
  // Normalize query state
  state = reduceSearchEntityState(
    state,
    new SetQueryAction({}, { partial: true, resetPagingIfModifying: false })
  );
  if (actions) {
    for (const action of actions) {
      state = reduceSearchEntityState(state, action);
    }
  }
  return state;
}

export function reduceSearchEntityState(
  state: Readonly<SearchEntityState>,
  action: SearchEntityStateAction
): Readonly<SearchEntityState> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

class SetPagingAction implements SearchEntityStateAction {
  paging: Paging;
  pagingCause: 'first-page' | 'prev-page' | 'next-page' | 'last-page' | undefined;

  constructor(
    paging: Paging,
    pagingCause?: 'first-page' | 'prev-page' | 'next-page' | 'last-page'
  ) {
    this.paging = paging;
    this.pagingCause = pagingCause;
  }

  reduce(state: Readonly<SearchEntityState>): Readonly<SearchEntityState> {
    if (isEqual(this.paging, state.paging)) {
      return state;
    }
    const { count } = getPagingInfo(this.paging).valueOrThrow();
    return {
      ...state,
      paging: this.paging,
      sampling: undefined,
      requestedCount: count || state.requestedCount,
      loadingState: this.pagingCause ?? '',
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

  reduce(state: Readonly<SearchEntityState>): Readonly<SearchEntityState> {
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

    let { loadingState } = state;
    if (sampling) {
      loadingState = 'sample';
    }

    return {
      ...state,
      sampling,
      query,
      paging: undefined,
      requestedCount: sampling.count || state.requestedCount,
      loadingState,
    };
  }
}

class SetQueryAction implements SearchEntityStateAction {
  readonly value: AdminSearchQuery | PublishedSearchQuery;
  readonly partial: boolean;
  readonly resetPagingIfModifying: boolean;

  constructor(
    value: AdminSearchQuery | PublishedSearchQuery,
    { partial, resetPagingIfModifying }: { partial: boolean; resetPagingIfModifying: boolean }
  ) {
    this.value = value;
    this.partial = partial;
    this.resetPagingIfModifying = resetPagingIfModifying;
  }

  reduce(state: Readonly<SearchEntityState>): Readonly<SearchEntityState> {
    const query: AdminSearchQuery | PublishedSearchQuery = this.partial
      ? { ...state.query, ...this.value }
      : { ...this.value };

    // Restrictions
    if (state.restrictEntityTypes.length > 0) {
      if (query.entityTypes && query.entityTypes.length > 0) {
        query.entityTypes = query.entityTypes.filter((it) =>
          state.restrictEntityTypes.includes(it)
        );
      } else {
        query.entityTypes = state.restrictEntityTypes;
      }
    }

    if (state.restrictLinksFrom) {
      query.linksFrom = state.restrictLinksFrom;
    }
    if (state.restrictLinksTo) {
      query.linksTo = state.restrictLinksTo;
    }

    // Sampling/paging
    const switchToSearch = (this.value.order || this.value.reverse !== undefined) && state.sampling;
    let { sampling, paging, loadingState } = state;
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

    if (this.resetPagingIfModifying && !sampling) {
      paging = {};
      loadingState = 'first-page';
    }
    return { ...state, query, text: query.text ?? '', paging, sampling, loadingState };
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

  reduce(state: Readonly<SearchEntityState>): Readonly<SearchEntityState> {
    if (state.connection === this.connection && state.connectionError === this.connectionError) {
      return state;
    }
    let { entities, entitiesScrollToTopSignal, loadingState } = state;
    if (!state.sampling && this.connection !== undefined) {
      entities = this.connection === null ? [] : this.connection.edges.map((it) => it.node);
      if (['first-page', 'prev-page', 'next-page', 'last-page'].includes(loadingState)) {
        entitiesScrollToTopSignal += 1;
        loadingState = '';
      }
    }
    return {
      ...state,
      connection: this.connection,
      connectionError: this.connectionError,
      entities,
      entitiesScrollToTopSignal,
      loadingState,
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

  reduce(state: Readonly<SearchEntityState>): Readonly<SearchEntityState> {
    if (
      state.entitySamples === this.entitySamples &&
      state.entitySamplesError === this.entitySamplesError
    ) {
      return state;
    }
    let { entities, entitiesScrollToTopSignal, loadingState } = state;
    if (state.sampling && this.entitySamples) {
      entities = this.entitySamples.items.map((it) => ok(it));
      if (loadingState === 'sample') {
        entitiesScrollToTopSignal += 1;
        loadingState = '';
      }
    }
    return {
      ...state,
      entitySamples: this.entitySamples,
      entitySamplesError: this.entitySamplesError,
      entities,
      entitiesScrollToTopSignal,
      loadingState,
    };
  }
}

class UpdateTotalCountAction implements SearchEntityStateAction {
  totalCount: number | null;

  constructor(totalCount: number | null) {
    this.totalCount = totalCount;
  }

  reduce(state: Readonly<SearchEntityState>): Readonly<SearchEntityState> {
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
