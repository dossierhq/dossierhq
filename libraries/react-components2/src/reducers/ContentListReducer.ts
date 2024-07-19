import {
  EntityQueryOrder,
  EntityStatus,
  getPagingInfo,
  ok,
  PublishedEntityQueryOrder,
  type Connection,
  type Edge,
  type Entity,
  type EntityQuery,
  type EntityReference,
  type EntitySamplingOptions,
  type EntitySamplingPayload,
  type ErrorResult,
  type ErrorType,
  type Paging,
  type PublishedEntity,
  type PublishedEntityQuery,
  type Result,
} from '@dossierhq/core';
import isEqual from 'lodash/isEqual.js';

const DEFAULT_VALUES = {
  full: {
    order: EntityQueryOrder.updatedAt,
    reverse: true,
    requestedCount: 25,
  },
  published: {
    order: PublishedEntityQueryOrder.name,
    reverse: false,
    requestedCount: 25,
  },
} as const;

export type ContentListViewMode = 'list' | 'split' | 'map';

interface ModeQueryTypeMap {
  full: EntityQuery;
  published: PublishedEntityQuery;
}

interface ModeEntityTypeMap {
  full: Entity;
  published: PublishedEntity;
}

export interface ContentListState<TMode extends 'full' | 'published' = 'full' | 'published'> {
  mode: TMode;

  restrictEntityTypes: string[];
  restrictLinksFrom: EntityReference | null;
  restrictLinksTo: EntityReference | null;

  query: ModeQueryTypeMap[TMode];
  paging: Paging | undefined;
  sampling: EntitySamplingOptions | undefined;
  requestedCount: number;
  text: string;

  connection: Connection<Edge<ModeEntityTypeMap[TMode], ErrorType>> | null | undefined;
  connectionError:
    | ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>
    | undefined;
  entitySamples: EntitySamplingPayload<ModeEntityTypeMap[TMode]> | undefined;
  entitySamplesError:
    | ErrorResult<unknown, typeof ErrorType.BadRequest | typeof ErrorType.Generic>
    | undefined;
  totalCount: number | null;

  viewMode: ContentListViewMode;

  // null until first loaded
  entities: Result<ModeEntityTypeMap[TMode], ErrorType>[] | null;
  loadingState: '' | 'sample' | 'next-page' | 'prev-page' | 'first-page' | 'last-page';
  entitiesScrollToTopSignal: number;
}

export interface ContentListStateAction {
  reduce(state: Readonly<ContentListState>): Readonly<ContentListState>;
}

const STATUS_ORDER = Object.values(EntityStatus);

export function initializeContentListState({
  mode,
  actions,
  restrictEntityTypes,
  restrictLinksFrom,
  restrictLinksTo,
}: {
  mode: 'full' | 'published';
  actions?: ContentListStateAction[];
  restrictEntityTypes?: string[];
  restrictLinksFrom?: EntityReference;
  restrictLinksTo?: EntityReference;
}): ContentListState<typeof mode> {
  const defaultValues = DEFAULT_VALUES[mode];
  let state: ContentListState = {
    mode,
    restrictEntityTypes: restrictEntityTypes ?? [],
    restrictLinksFrom: restrictLinksFrom ?? null,
    restrictLinksTo: restrictLinksTo ?? null,
    query: {},
    paging: {},
    sampling: undefined,
    requestedCount: defaultValues.requestedCount,
    text: '',
    viewMode: 'list',
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
  state = reduceContentListState(
    state,
    new SetQueryAction({}, { partial: true, resetPagingIfModifying: false }),
  );
  if (actions) {
    for (const action of actions) {
      state = reduceContentListState(state, action);
    }
  }
  return state;
}

export function reduceContentListState(
  state: Readonly<ContentListState>,
  action: ContentListStateAction,
): Readonly<ContentListState> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

class SetPagingAction implements ContentListStateAction {
  paging: Paging;
  pagingCause: 'first-page' | 'prev-page' | 'next-page' | 'last-page' | undefined;

  constructor(
    paging: Paging,
    pagingCause?: 'first-page' | 'prev-page' | 'next-page' | 'last-page',
  ) {
    this.paging = paging;
    this.pagingCause = pagingCause;
  }

  reduce(state: Readonly<ContentListState>): Readonly<ContentListState> {
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

class SetSamplingAction implements ContentListStateAction {
  readonly value: EntitySamplingOptions;
  readonly partial: boolean;

  constructor(value: EntitySamplingOptions, partial: boolean) {
    this.value = value;
    this.partial = partial;
  }

  reduce(state: Readonly<ContentListState>): Readonly<ContentListState> {
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

class SetQueryAction implements ContentListStateAction {
  readonly value: EntityQuery | PublishedEntityQuery;
  readonly partial: boolean;
  readonly resetPagingIfModifying: boolean;

  constructor(
    value: EntityQuery | PublishedEntityQuery,
    { partial, resetPagingIfModifying }: { partial: boolean; resetPagingIfModifying: boolean },
  ) {
    this.value = value;
    this.partial = partial;
    this.resetPagingIfModifying = resetPagingIfModifying;
  }

  reduce(state: Readonly<ContentListState>): Readonly<ContentListState> {
    const query: EntityQuery | PublishedEntityQuery = this.partial
      ? { ...state.query, ...this.value }
      : { ...this.value };

    // Restrictions
    if (state.restrictEntityTypes.length > 0) {
      if (query.entityTypes && query.entityTypes.length > 0) {
        query.entityTypes = query.entityTypes.filter((it) =>
          state.restrictEntityTypes.includes(it),
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
    if (query.entityTypes && query.entityTypes !== state.query.entityTypes) {
      query.entityTypes = query.entityTypes.toSorted();
    }
    if (query.componentTypes?.length === 0) {
      delete query.componentTypes;
    }
    if (query.componentTypes && query.componentTypes !== state.query.componentTypes) {
      query.componentTypes = query.componentTypes.toSorted();
    }
    if (query.text?.length === 0) {
      delete query.text;
    }
    if (state.mode === 'full') {
      if (query.status?.length === 0) {
        delete query.status;
      }
      if (query.status && query.status !== (state.query as EntityQuery).status) {
        query.status = query.status.toSorted((a, b) => {
          const aIndex = STATUS_ORDER.indexOf(a);
          const bIndex = STATUS_ORDER.indexOf(b);
          return aIndex - bIndex;
        });
      }
    }

    if (paging) {
      if (!query.order) {
        const defaultValues = DEFAULT_VALUES[state.mode];
        query.order = defaultValues.order;
        query.reverse = defaultValues.reverse;
      }
    } else {
      delete query.order;
      delete query.reverse;
    }

    if (
      isEqual(
        { query, paging, sampling },
        { query: state.query, paging: state.paging, sampling: state.sampling },
      )
    ) {
      return state;
    }

    if (this.resetPagingIfModifying && !sampling) {
      paging = {};
      loadingState = 'first-page';
    }

    let viewMode = state.viewMode;
    if (query.boundingBox) {
      viewMode = 'map';
    }
    if (!query.boundingBox && viewMode === 'map') {
      viewMode = 'list';
    }

    return { ...state, query, text: query.text ?? '', paging, sampling, loadingState, viewMode };
  }
}

class SetViewModeAction implements ContentListStateAction {
  readonly value: ContentListViewMode;

  constructor(value: ContentListViewMode) {
    this.value = value;
  }

  reduce(state: Readonly<ContentListState>): Readonly<ContentListState> {
    if (state.viewMode === this.value) {
      return state;
    }
    return { ...state, viewMode: this.value };
  }
}

class UpdateSearchResultAction implements ContentListStateAction {
  connection: ContentListState['connection'];
  connectionError: ContentListState['connectionError'];

  constructor(
    connection: ContentListState['connection'],
    connectionError: ContentListState['connectionError'],
  ) {
    this.connection = connection;
    this.connectionError = connectionError;
  }

  reduce(state: Readonly<ContentListState>): Readonly<ContentListState> {
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

class UpdateSampleResultAction implements ContentListStateAction {
  entitySamples: ContentListState['entitySamples'];
  entitySamplesError: ContentListState['entitySamplesError'];

  constructor(
    entitySamples: ContentListState['entitySamples'],
    entitySamplesError: ContentListState['entitySamplesError'],
  ) {
    this.entitySamples = entitySamples;
    this.entitySamplesError = entitySamplesError;
  }

  reduce(state: Readonly<ContentListState>): Readonly<ContentListState> {
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

class UpdateTotalCountAction implements ContentListStateAction {
  totalCount: number | null;

  constructor(totalCount: number | null) {
    this.totalCount = totalCount;
  }

  reduce(state: Readonly<ContentListState>): Readonly<ContentListState> {
    if (state.totalCount === this.totalCount) {
      return state;
    }
    return {
      ...state,
      totalCount: this.totalCount,
    };
  }
}

export const ContentListStateActions = {
  SetPaging: SetPagingAction,
  SetSampling: SetSamplingAction,
  SetQuery: SetQueryAction,
  SetViewMode: SetViewModeAction,
  UpdateSearchResult: UpdateSearchResultAction,
  UpdateSampleResult: UpdateSampleResultAction,
  UpdateTotalCount: UpdateTotalCountAction,
};

export function getQueryWithoutDefaults(
  mode: 'full' | 'published',
  query: EntityQuery | PublishedEntityQuery,
): EntityQuery | PublishedEntityQuery {
  let changed = false;
  const newQuery = { ...query };
  const defaultValues = DEFAULT_VALUES[mode];
  if (query.order === defaultValues.order && query.reverse === defaultValues.reverse) {
    delete newQuery.order;
    delete newQuery.reverse;
    changed = true;
  }
  if (query.reverse === false) {
    delete newQuery.reverse;
    changed = true;
  }
  return changed ? newQuery : query;
}
