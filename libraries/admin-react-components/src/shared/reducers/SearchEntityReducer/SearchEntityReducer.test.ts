import type {
  Connection,
  Edge,
  EntitySamplingPayload,
  ErrorType,
  PublishedEntity,
} from '@jonasb/datadata-core';
import { AdminQueryOrder, ok } from '@jonasb/datadata-core';
import { describe, expect, test } from 'vitest';
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
      createdAt: new Date('2022-03-19T07:51:25.56Z'),
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
    expect(initializeSearchEntityState({})).toMatchInlineSnapshot(`
      {
        "connection": undefined,
        "connectionError": undefined,
        "entities": null,
        "entitiesScrollToTopSignal": 0,
        "entitySamples": undefined,
        "entitySamplesError": undefined,
        "loadingState": "",
        "paging": {},
        "query": {
          "order": "name",
        },
        "requestedCount": 25,
        "restrictEntityTypes": [],
        "restrictLinksFrom": null,
        "restrictLinksTo": null,
        "sampling": undefined,
        "text": "",
        "totalCount": null,
      }
    `);
  });

  test('restrict entity types', () => {
    expect(initializeSearchEntityState({ restrictEntityTypes: ['Foo', 'Bar'] }))
      .toMatchInlineSnapshot(`
        {
          "connection": undefined,
          "connectionError": undefined,
          "entities": null,
          "entitiesScrollToTopSignal": 0,
          "entitySamples": undefined,
          "entitySamplesError": undefined,
          "loadingState": "",
          "paging": {},
          "query": {
            "entityTypes": [
              "Foo",
              "Bar",
            ],
            "order": "name",
          },
          "requestedCount": 25,
          "restrictEntityTypes": [
            "Foo",
            "Bar",
          ],
          "restrictLinksFrom": null,
          "restrictLinksTo": null,
          "sampling": undefined,
          "text": "",
          "totalCount": null,
        }
      `);
  });

  test('restrict linksFrom', () => {
    const state = initializeSearchEntityState({ restrictLinksFrom: { id: '123' } });
    expect(state).toMatchSnapshot();
    expect(state.query.linksFrom).toEqual({ id: '123' });
  });

  test('restrict linksTo', () => {
    const state = initializeSearchEntityState({ restrictLinksTo: { id: '123' } });
    expect(state).toMatchSnapshot();
    expect(state.query.linksTo).toEqual({ id: '123' });
  });
});

describe('SearchEntityStateActions.SetQuery', () => {
  test('Resets sampling if setting order', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState({
        actions: [new SearchEntityStateActions.SetSampling({}, true)],
      }),
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
      initializeSearchEntityState({
        actions: [
          new SearchEntityStateActions.SetPaging({ after: 'cursor', first: 10 }, 'next-page'),
        ],
      }),
      new SearchEntityStateActions.SetQuery(
        { order: AdminQueryOrder.updatedAt },
        { partial: true, resetPagingIfModifying: true }
      )
    );
    expect(state.query).toEqual({ order: AdminQueryOrder.updatedAt });
    expect(state.paging).toEqual({});
    expect(state.sampling).toBeUndefined();
  });

  test('Does not reset paging when changing bounding box and not sampling', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState({
        actions: [new SearchEntityStateActions.SetSampling({ count: 10, seed: 123 }, false)],
      }),
      new SearchEntityStateActions.SetQuery(
        { boundingBox: { minLat: 55.07, maxLat: 56.79, minLng: 11.62, maxLng: 16.25 } },
        { partial: true, resetPagingIfModifying: true }
      )
    );
    expect(state.query).toEqual({
      boundingBox: { minLat: 55.07, maxLat: 56.79, minLng: 11.62, maxLng: 16.25 },
    });
    expect(state.paging).toBeUndefined();
    expect(state.sampling).toEqual({ count: 10, seed: 123 });
  });
});

describe('SearchEntityStateActions.SetPaging', () => {
  test('Empty paging', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState({}),
      new SearchEntityStateActions.SetPaging({})
    );
    expect(state.paging).toEqual({});
    expect(state.sampling).toBeUndefined();
  });

  test('Resets sampling', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState({
        actions: [new SearchEntityStateActions.SetSampling({}, true)],
      }),
      new SearchEntityStateActions.SetPaging({})
    );
    expect(state.paging).toEqual({});
    expect(state.sampling).toBeUndefined();
  });
});

describe('SearchEntityStateActions.SetSampling', () => {
  test('Empty sampling', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState({}),
      new SearchEntityStateActions.SetSampling({}, true)
    );
    expect(state.sampling).toEqual({ seed: expect.any(Number) });
    expect(state.paging).toBeUndefined();
  });

  test('Resets paging', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState({
        actions: [new SearchEntityStateActions.SetPaging({ first: 200 })],
      }),
      new SearchEntityStateActions.SetSampling({}, true)
    );
    expect(state.sampling).toEqual({ seed: expect.any(Number) });
    expect(state.paging).toBeUndefined();
  });

  test('Resets order', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState({
        actions: [
          new SearchEntityStateActions.SetQuery(
            { order: AdminQueryOrder.updatedAt },
            { partial: true, resetPagingIfModifying: true }
          ),
        ],
      }),
      new SearchEntityStateActions.SetSampling({}, true)
    );
    expect(state.sampling).toEqual({ seed: expect.any(Number) });
    expect(state.query).toEqual({});
  });

  test('Partial count, keeps seed', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState({
        actions: [new SearchEntityStateActions.SetSampling({ seed: 123 }, false)],
      }),
      new SearchEntityStateActions.SetSampling({ count: 100 }, true)
    );
    expect(state.sampling).toEqual({ seed: 123, count: 100 });
    expect(state.requestedCount).toBe(100);
  });
});

describe('SearchEntityState scenarios', () => {
  test('Next page -> loading -> loaded', () => {
    const initialState = initializeSearchEntityState({
      actions: [
        new SearchEntityStateActions.SetPaging({ first: 1 }),
        new SearchEntityStateActions.UpdateSearchResult(
          createPublishedEntityConnection(['1'], { hasPreviousPage: false, hasNextPage: true }),
          undefined
        ),
        new SearchEntityStateActions.UpdateTotalCount(2),
      ],
    });
    expect(initialState).toMatchSnapshot('1 - initial');

    const loadingState = reduceSearchEntityStateActions(
      initialState,
      new SearchEntityStateActions.SetPaging({ after: 'cursor-1' }, 'next-page'),
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

    expect(initialState.entitiesScrollToTopSignal).toBeLessThan(
      loadedState.entitiesScrollToTopSignal
    );
  });

  test('Sampling -> change seed -> loading -> loaded', () => {
    const initialState = initializeSearchEntityState({
      actions: [
        new SearchEntityStateActions.SetSampling({ count: 1, seed: 123 }, false),
        new SearchEntityStateActions.UpdateSampleResult(
          createPublishedEntitySamplingPayload(['1'], { seed: 123, totalCount: 2 }),
          undefined
        ),
      ],
    });
    expect(initialState).toMatchSnapshot('1 - initial');

    const loadingState = reduceSearchEntityStateActions(
      initialState,
      new SearchEntityStateActions.SetSampling({ seed: 456 }, true),
      new SearchEntityStateActions.UpdateSampleResult(undefined, undefined)
    );
    expect(loadingState).toMatchSnapshot('2 - loading');

    const loadedState = reduceSearchEntityStateActions(
      loadingState,
      new SearchEntityStateActions.UpdateSampleResult(
        createPublishedEntitySamplingPayload(['2'], { seed: 456, totalCount: 2 }),
        undefined
      )
    );
    expect(loadedState).toMatchSnapshot('3 - loaded');

    expect(initialState.entitiesScrollToTopSignal).toBeLessThan(
      loadedState.entitiesScrollToTopSignal
    );
  });

  test('From searching -> set sampling -> loading -> loaded', () => {
    const initialState = initializeSearchEntityState({
      actions: [
        new SearchEntityStateActions.SetPaging({ first: 1 }),
        new SearchEntityStateActions.UpdateSearchResult(
          createPublishedEntityConnection(['1'], { hasPreviousPage: false, hasNextPage: true }),
          undefined
        ),
        new SearchEntityStateActions.UpdateTotalCount(2),
        new SearchEntityStateActions.UpdateSampleResult(undefined, undefined),
      ],
    });
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

    expect(initialState.entitiesScrollToTopSignal).toBeLessThan(
      loadedState.entitiesScrollToTopSignal
    );
  });

  test('From sampling -> set paging -> loading -> loaded', () => {
    const initialState = initializeSearchEntityState({
      actions: [
        new SearchEntityStateActions.SetSampling({ count: 1, seed: 123 }, false),
        new SearchEntityStateActions.UpdateSampleResult(
          createPublishedEntitySamplingPayload(['1'], { seed: 123, totalCount: 1 }),
          undefined
        ),
      ],
    });
    expect(initialState).toMatchSnapshot('1 - initial');

    const loadingState = reduceSearchEntityStateActions(
      initialState,
      new SearchEntityStateActions.SetPaging({ first: 1 }, 'first-page'),
      new SearchEntityStateActions.UpdateSampleResult(undefined, undefined),
      new SearchEntityStateActions.UpdateSearchResult(undefined, undefined),
      new SearchEntityStateActions.UpdateTotalCount(null)
    );
    expect(loadingState).toMatchSnapshot('2 - loading');

    const loadedState = reduceSearchEntityStateActions(
      loadingState,
      new SearchEntityStateActions.UpdateSearchResult(
        createPublishedEntityConnection(['2'], { hasPreviousPage: false, hasNextPage: true }),
        undefined
      ),
      new SearchEntityStateActions.UpdateTotalCount(2)
    );
    expect(loadedState).toMatchSnapshot('3 - loaded');

    expect(initialState.entitiesScrollToTopSignal).toBeLessThan(
      loadedState.entitiesScrollToTopSignal
    );
  });

  test('Refresh', () => {
    const initialState = initializeSearchEntityState({
      actions: [
        new SearchEntityStateActions.SetPaging({ first: 1 }),
        new SearchEntityStateActions.UpdateSearchResult(
          createPublishedEntityConnection(['1'], { hasPreviousPage: false, hasNextPage: true }),
          undefined
        ),
        new SearchEntityStateActions.UpdateTotalCount(2),
      ],
    });
    expect(initialState).toMatchSnapshot('1 - initial');

    const loadedState = reduceSearchEntityStateActions(
      initialState,
      new SearchEntityStateActions.UpdateSearchResult(
        createPublishedEntityConnection(['2'], { hasPreviousPage: false, hasNextPage: true }),
        undefined
      )
    );
    expect(loadedState).toMatchSnapshot('2 - loaded');

    expect(initialState.entitiesScrollToTopSignal).toEqual(loadedState.entitiesScrollToTopSignal);
  });
});
