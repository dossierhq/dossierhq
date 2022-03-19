import type {
  Connection,
  Edge,
  EntitySamplingPayload,
  ErrorType,
  PublishedEntity,
} from '@jonasb/datadata-core';
import { AdminQueryOrder, ok } from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import type { SearchEntityState, SearchEntityStateAction } from './SearchEntityReducer';
import {
  initializeSearchEntityState,
  reduceSearchEntityState,
  SearchEntityStateActions,
} from './SearchEntityReducer';

function createPublishedEntity(id: string): PublishedEntity {
  return {
    id,
    info: {
      name: `Entity ${id}`,
      type: 'TitleOnly',
      authKey: 'none',
      createdAt: Temporal.Instant.from('2022-03-19T07:51:25.56Z'),
    },
    fields: { title: `Title ${id}` },
  };
}

function createPublishedEntityConnection(
  ids: string[],
  { hasPreviousPage, hasNextPage }: { hasPreviousPage: boolean; hasNextPage: boolean }
): Connection<Edge<PublishedEntity, ErrorType>> {
  return {
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: `cursor-${ids[0]}`,
      endCursor: `cursor-${ids[ids.length - 1]}`,
    },
    edges: ids.map((id) => ({
      cursor: `cursor-${id}`,
      node: ok(createPublishedEntity(id)),
    })),
  };
}

function createPublishedEntitySamplingPayload(
  ids: string[],
  { seed, totalCount }: { seed: number; totalCount: number }
): EntitySamplingPayload<PublishedEntity> {
  return {
    seed,
    totalCount,
    items: ids.map(createPublishedEntity),
  };
}

function reduceSearchEntityStateActions(
  state: SearchEntityState,
  ...actions: SearchEntityStateAction[]
) {
  let newState = state;
  for (const action of actions) {
    newState = reduceSearchEntityState(newState, action);
  }
  return newState;
}

describe('initializeSearchEntityState', () => {
  test('default', () => {
    expect(initializeSearchEntityState([])).toMatchInlineSnapshot(`
      Object {
        "connection": undefined,
        "connectionError": undefined,
        "entities": Array [],
        "entitySamples": undefined,
        "entitySamplesError": undefined,
        "paging": Object {},
        "query": Object {
          "order": "name",
        },
        "requestedCount": 25,
        "sampling": undefined,
        "text": "",
        "totalCount": null,
      }
    `);
  });
});

describe('SearchEntityStateActions.SetQuery', () => {
  test('Resets sampling if setting order', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState([new SearchEntityStateActions.SetSampling({}, true)]),
      new SearchEntityStateActions.SetQuery(
        { order: AdminQueryOrder.updatedAt },
        { partial: true, resetPagingIfModifying: true }
      )
    );
    expect(state.query).toEqual({ order: AdminQueryOrder.updatedAt });
    expect(state.paging).toEqual({});
    expect(state.sampling).toBeUndefined();
  });

  test('Resets paging (when configured)', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState([
        new SearchEntityStateActions.SetPaging({ after: 'cursor', first: 10 }),
      ]),
      new SearchEntityStateActions.SetQuery(
        { order: AdminQueryOrder.updatedAt },
        { partial: true, resetPagingIfModifying: true }
      )
    );
    expect(state.query).toEqual({ order: AdminQueryOrder.updatedAt });
    expect(state.paging).toEqual({});
    expect(state.sampling).toBeUndefined();
  });
});

describe('SearchEntityStateActions.SetPaging', () => {
  test('Empty paging', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState([]),
      new SearchEntityStateActions.SetPaging({})
    );
    expect(state.paging).toEqual({});
    expect(state.sampling).toBeUndefined();
  });

  test('Resets sampling', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState([new SearchEntityStateActions.SetSampling({}, true)]),
      new SearchEntityStateActions.SetPaging({})
    );
    expect(state.paging).toEqual({});
    expect(state.sampling).toBeUndefined();
  });
});

describe('SearchEntityStateActions.SetSampling', () => {
  test('Empty sampling', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState([]),
      new SearchEntityStateActions.SetSampling({}, true)
    );
    expect(state.sampling).toEqual({ seed: expect.any(Number) });
    expect(state.paging).toBeUndefined();
  });

  test('Resets paging', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState([new SearchEntityStateActions.SetPaging({ first: 200 })]),
      new SearchEntityStateActions.SetSampling({}, true)
    );
    expect(state.sampling).toEqual({ seed: expect.any(Number) });
    expect(state.paging).toBeUndefined();
  });

  test('Resets order', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState([
        new SearchEntityStateActions.SetQuery(
          { order: AdminQueryOrder.updatedAt },
          { partial: true, resetPagingIfModifying: true }
        ),
      ]),
      new SearchEntityStateActions.SetSampling({}, true)
    );
    expect(state.sampling).toEqual({ seed: expect.any(Number) });
    expect(state.query).toEqual({});
  });

  test('Partial count, keeps seed', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState([new SearchEntityStateActions.SetSampling({ seed: 123 }, false)]),
      new SearchEntityStateActions.SetSampling({ count: 100 }, true)
    );
    expect(state.sampling).toEqual({ seed: 123, count: 100 });
    expect(state.requestedCount).toBe(100);
  });
});

describe('SearchEntityState scenarios', () => {
  test('Next page -> loading -> loaded', () => {
    const initialState = initializeSearchEntityState([
      new SearchEntityStateActions.SetPaging({ first: 1 }),
      new SearchEntityStateActions.UpdateSearchResult(
        createPublishedEntityConnection(['1'], { hasPreviousPage: false, hasNextPage: true }),
        undefined
      ),
      new SearchEntityStateActions.UpdateTotalCount(2),
    ]);
    expect(initialState).toMatchSnapshot('1 - initial');

    const loadingState = reduceSearchEntityStateActions(
      initialState,
      new SearchEntityStateActions.SetPaging({ after: 'cursor-1' }),
      new SearchEntityStateActions.UpdateSearchResult(undefined, undefined)
    );
    expect(loadingState).toMatchSnapshot('2 - loading');

    const loadedState = reduceSearchEntityState(
      loadingState,
      new SearchEntityStateActions.UpdateSearchResult(
        createPublishedEntityConnection(['2'], { hasPreviousPage: true, hasNextPage: false }),
        undefined
      )
    );
    expect(loadedState).toMatchSnapshot('3 - loaded');
  });

  test('Set sampling -> loading -> loaded', () => {
    const initialState = initializeSearchEntityState([
      new SearchEntityStateActions.SetPaging({ first: 1 }),
      new SearchEntityStateActions.UpdateSearchResult(
        createPublishedEntityConnection(['1'], { hasPreviousPage: false, hasNextPage: true }),
        undefined
      ),
      new SearchEntityStateActions.UpdateTotalCount(2),
      new SearchEntityStateActions.UpdateSampleResult(undefined, undefined),
    ]);
    expect(initialState).toMatchSnapshot('1 - initial');

    const loadingState = reduceSearchEntityStateActions(
      initialState,
      new SearchEntityStateActions.SetSampling({ count: 1, seed: 123 }, false),
      new SearchEntityStateActions.UpdateSearchResult(undefined, undefined),
      new SearchEntityStateActions.UpdateTotalCount(null)
    );
    expect(loadingState).toMatchSnapshot('2 - loading');

    const loadedState = reduceSearchEntityState(
      loadingState,
      new SearchEntityStateActions.UpdateSampleResult(
        createPublishedEntitySamplingPayload(['2'], { seed: 123, totalCount: 1 }),
        undefined
      )
    );
    expect(loadedState).toMatchSnapshot('3 - loaded');
  });
});
