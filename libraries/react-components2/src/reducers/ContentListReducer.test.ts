import {
  EntityQueryOrder,
  ok,
  type Connection,
  type Edge,
  type EntitySamplingPayload,
  type ErrorType,
  type PublishedEntity,
} from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import {
  ContentListStateActions,
  initializeContentListState,
  reduceContentListState,
  type ContentListState,
  type ContentListStateAction,
} from './ContentListReducer.js';

function createPublishedEntity(id: string): PublishedEntity {
  return {
    id,
    info: {
      name: `Entity ${id}`,
      type: 'TitleOnly',
      authKey: '',
      createdAt: new Date('2022-03-19T07:51:25.56Z'),
      valid: true,
    },
    fields: { title: `Title ${id}` },
  };
}

function createPublishedEntityConnection(
  ids: string[],
  { hasPreviousPage, hasNextPage }: { hasPreviousPage: boolean; hasNextPage: boolean },
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
  { seed, totalCount }: { seed: number; totalCount: number },
): EntitySamplingPayload<PublishedEntity> {
  return {
    seed,
    totalCount,
    items: ids.map(createPublishedEntity),
  };
}

function reduceContentListStateActions(
  state: ContentListState,
  ...actions: ContentListStateAction[]
) {
  let newState = state;
  for (const action of actions) {
    newState = reduceContentListState(newState, action);
  }
  return newState;
}

describe('initializeContentListState', () => {
  test('default', () => {
    expect(initializeContentListState({ mode: 'full' })).toMatchInlineSnapshot(`
      {
        "connection": undefined,
        "connectionError": undefined,
        "entities": null,
        "entitiesScrollToTopSignal": 0,
        "entitySamples": undefined,
        "entitySamplesError": undefined,
        "loadingState": "",
        "mode": "full",
        "paging": {},
        "query": {
          "order": "updatedAt",
          "reverse": true,
        },
        "requestedCount": 25,
        "restrictEntityTypes": [],
        "restrictLinksFrom": null,
        "restrictLinksTo": null,
        "sampling": undefined,
        "text": "",
        "totalCount": null,
        "viewMode": "list",
      }
    `);
  });

  test('restrict entity types', () => {
    expect(initializeContentListState({ mode: 'full', restrictEntityTypes: ['Foo', 'Bar'] }))
      .toMatchInlineSnapshot(`
        {
          "connection": undefined,
          "connectionError": undefined,
          "entities": null,
          "entitiesScrollToTopSignal": 0,
          "entitySamples": undefined,
          "entitySamplesError": undefined,
          "loadingState": "",
          "mode": "full",
          "paging": {},
          "query": {
            "entityTypes": [
              "Foo",
              "Bar",
            ],
            "order": "updatedAt",
            "reverse": true,
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
          "viewMode": "list",
        }
      `);
  });

  test('restrict linksFrom', () => {
    const state = initializeContentListState({ mode: 'full', restrictLinksFrom: { id: '123' } });
    expect(state).toMatchSnapshot();
    expect(state.query.linksFrom).toEqual({ id: '123' });
  });

  test('restrict linksTo', () => {
    const state = initializeContentListState({ mode: 'full', restrictLinksTo: { id: '123' } });
    expect(state).toMatchSnapshot();
    expect(state.query.linksTo).toEqual({ id: '123' });
  });
});

describe('ContentListStateActions.SetQuery', () => {
  test('Resets sampling if setting order', () => {
    const state = reduceContentListState(
      initializeContentListState({
        mode: 'full',
        actions: [new ContentListStateActions.SetSampling({}, true)],
      }),
      new ContentListStateActions.SetQuery(
        { order: EntityQueryOrder.updatedAt },
        { partial: true, resetPagingIfModifying: true },
      ),
    );
    expect(state.query).toEqual({ order: EntityQueryOrder.updatedAt });
    expect(state.paging).toEqual({});
    expect(state.sampling).toBeUndefined();
  });

  test('Resets paging (when configured)', () => {
    const state = reduceContentListState(
      initializeContentListState({
        mode: 'full',
        actions: [
          new ContentListStateActions.SetPaging({ after: 'cursor', first: 10 }, 'next-page'),
        ],
      }),
      new ContentListStateActions.SetQuery(
        { order: EntityQueryOrder.name, reverse: false },
        { partial: true, resetPagingIfModifying: true },
      ),
    );
    expect(state.query).toEqual({ order: EntityQueryOrder.name, reverse: false });
    expect(state.paging).toEqual({});
    expect(state.sampling).toBeUndefined();
  });

  test('Does not reset paging when changing bounding box and not sampling', () => {
    const state = reduceContentListState(
      initializeContentListState({
        mode: 'full',
        actions: [new ContentListStateActions.SetSampling({ count: 10, seed: 123 }, false)],
      }),
      new ContentListStateActions.SetQuery(
        { boundingBox: { minLat: 55.07, maxLat: 56.79, minLng: 11.62, maxLng: 16.25 } },
        { partial: true, resetPagingIfModifying: true },
      ),
    );
    expect(state.query).toEqual({
      boundingBox: { minLat: 55.07, maxLat: 56.79, minLng: 11.62, maxLng: 16.25 },
    });
    expect(state.paging).toBeUndefined();
    expect(state.sampling).toEqual({ count: 10, seed: 123 });
  });
});

describe('ContentListStateActions.SetPaging', () => {
  test('Empty paging', () => {
    const state = reduceContentListState(
      initializeContentListState({ mode: 'full' }),
      new ContentListStateActions.SetPaging({}),
    );
    expect(state.paging).toEqual({});
    expect(state.sampling).toBeUndefined();
  });

  test('Resets sampling', () => {
    const state = reduceContentListState(
      initializeContentListState({
        mode: 'full',
        actions: [new ContentListStateActions.SetSampling({}, true)],
      }),
      new ContentListStateActions.SetPaging({}),
    );
    expect(state.paging).toEqual({});
    expect(state.sampling).toBeUndefined();
  });
});

describe('ContentListStateActions.SetSampling', () => {
  test('Empty sampling', () => {
    const state = reduceContentListState(
      initializeContentListState({ mode: 'full' }),
      new ContentListStateActions.SetSampling({}, true),
    );
    expect(state.sampling).toEqual({ seed: expect.any(Number) });
    expect(state.paging).toBeUndefined();
  });

  test('Resets paging', () => {
    const state = reduceContentListState(
      initializeContentListState({
        mode: 'full',
        actions: [new ContentListStateActions.SetPaging({ first: 200 })],
      }),
      new ContentListStateActions.SetSampling({}, true),
    );
    expect(state.sampling).toEqual({ seed: expect.any(Number) });
    expect(state.paging).toBeUndefined();
  });

  test('Resets order', () => {
    const state = reduceContentListState(
      initializeContentListState({
        mode: 'full',
        actions: [
          new ContentListStateActions.SetQuery(
            { order: EntityQueryOrder.updatedAt },
            { partial: true, resetPagingIfModifying: true },
          ),
        ],
      }),
      new ContentListStateActions.SetSampling({}, true),
    );
    expect(state.sampling).toEqual({ seed: expect.any(Number) });
    expect(state.query).toEqual({});
  });

  test('Partial count, keeps seed', () => {
    const state = reduceContentListState(
      initializeContentListState({
        mode: 'full',
        actions: [new ContentListStateActions.SetSampling({ seed: 123 }, false)],
      }),
      new ContentListStateActions.SetSampling({ count: 100 }, true),
    );
    expect(state.sampling).toEqual({ seed: 123, count: 100 });
    expect(state.requestedCount).toBe(100);
  });
});

describe('ContentListState scenarios', () => {
  test('Next page -> loading -> loaded', () => {
    const initialState = initializeContentListState({
      mode: 'full',
      actions: [
        new ContentListStateActions.SetPaging({ first: 1 }),
        new ContentListStateActions.UpdateSearchResult(
          createPublishedEntityConnection(['1'], { hasPreviousPage: false, hasNextPage: true }),
          undefined,
        ),
        new ContentListStateActions.UpdateTotalCount(2),
      ],
    });
    expect(initialState).toMatchSnapshot('1 - initial');

    const loadingState = reduceContentListStateActions(
      initialState,
      new ContentListStateActions.SetPaging({ after: 'cursor-1' }, 'next-page'),
      new ContentListStateActions.UpdateSearchResult(undefined, undefined),
    );
    expect(loadingState).toMatchSnapshot('2 - loading');

    const loadedState = reduceContentListState(
      loadingState,
      new ContentListStateActions.UpdateSearchResult(
        createPublishedEntityConnection(['2'], { hasPreviousPage: true, hasNextPage: false }),
        undefined,
      ),
    );
    expect(loadedState).toMatchSnapshot('3 - loaded');

    expect(initialState.entitiesScrollToTopSignal).toBeLessThan(
      loadedState.entitiesScrollToTopSignal,
    );
  });

  test('Sampling -> change seed -> loading -> loaded', () => {
    const initialState = initializeContentListState({
      mode: 'full',
      actions: [
        new ContentListStateActions.SetSampling({ count: 1, seed: 123 }, false),
        new ContentListStateActions.UpdateSampleResult(
          createPublishedEntitySamplingPayload(['1'], { seed: 123, totalCount: 2 }),
          undefined,
        ),
      ],
    });
    expect(initialState).toMatchSnapshot('1 - initial');

    const loadingState = reduceContentListStateActions(
      initialState,
      new ContentListStateActions.SetSampling({ seed: 456 }, true),
      new ContentListStateActions.UpdateSampleResult(undefined, undefined),
    );
    expect(loadingState).toMatchSnapshot('2 - loading');

    const loadedState = reduceContentListStateActions(
      loadingState,
      new ContentListStateActions.UpdateSampleResult(
        createPublishedEntitySamplingPayload(['2'], { seed: 456, totalCount: 2 }),
        undefined,
      ),
    );
    expect(loadedState).toMatchSnapshot('3 - loaded');

    expect(initialState.entitiesScrollToTopSignal).toBeLessThan(
      loadedState.entitiesScrollToTopSignal,
    );
  });

  test('From searching -> set sampling -> loading -> loaded', () => {
    const initialState = initializeContentListState({
      mode: 'full',
      actions: [
        new ContentListStateActions.SetPaging({ first: 1 }),
        new ContentListStateActions.UpdateSearchResult(
          createPublishedEntityConnection(['1'], { hasPreviousPage: false, hasNextPage: true }),
          undefined,
        ),
        new ContentListStateActions.UpdateTotalCount(2),
        new ContentListStateActions.UpdateSampleResult(undefined, undefined),
      ],
    });
    expect(initialState).toMatchSnapshot('1 - initial');

    const loadingState = reduceContentListStateActions(
      initialState,
      new ContentListStateActions.SetSampling({ count: 1, seed: 123 }, false),
      new ContentListStateActions.UpdateSearchResult(undefined, undefined),
      new ContentListStateActions.UpdateTotalCount(null),
    );
    expect(loadingState).toMatchSnapshot('2 - loading');

    const loadedState = reduceContentListState(
      loadingState,
      new ContentListStateActions.UpdateSampleResult(
        createPublishedEntitySamplingPayload(['2'], { seed: 123, totalCount: 1 }),
        undefined,
      ),
    );
    expect(loadedState).toMatchSnapshot('3 - loaded');

    expect(initialState.entitiesScrollToTopSignal).toBeLessThan(
      loadedState.entitiesScrollToTopSignal,
    );
  });

  test('From sampling -> set paging -> loading -> loaded', () => {
    const initialState = initializeContentListState({
      mode: 'full',
      actions: [
        new ContentListStateActions.SetSampling({ count: 1, seed: 123 }, false),
        new ContentListStateActions.UpdateSampleResult(
          createPublishedEntitySamplingPayload(['1'], { seed: 123, totalCount: 1 }),
          undefined,
        ),
      ],
    });
    expect(initialState).toMatchSnapshot('1 - initial');

    const loadingState = reduceContentListStateActions(
      initialState,
      new ContentListStateActions.SetPaging({ first: 1 }, 'first-page'),
      new ContentListStateActions.UpdateSampleResult(undefined, undefined),
      new ContentListStateActions.UpdateSearchResult(undefined, undefined),
      new ContentListStateActions.UpdateTotalCount(null),
    );
    expect(loadingState).toMatchSnapshot('2 - loading');

    const loadedState = reduceContentListStateActions(
      loadingState,
      new ContentListStateActions.UpdateSearchResult(
        createPublishedEntityConnection(['2'], { hasPreviousPage: false, hasNextPage: true }),
        undefined,
      ),
      new ContentListStateActions.UpdateTotalCount(2),
    );
    expect(loadedState).toMatchSnapshot('3 - loaded');

    expect(initialState.entitiesScrollToTopSignal).toBeLessThan(
      loadedState.entitiesScrollToTopSignal,
    );
  });

  test('Refresh', () => {
    const initialState = initializeContentListState({
      mode: 'full',
      actions: [
        new ContentListStateActions.SetPaging({ first: 1 }),
        new ContentListStateActions.UpdateSearchResult(
          createPublishedEntityConnection(['1'], { hasPreviousPage: false, hasNextPage: true }),
          undefined,
        ),
        new ContentListStateActions.UpdateTotalCount(2),
      ],
    });
    expect(initialState).toMatchSnapshot('1 - initial');

    const loadedState = reduceContentListStateActions(
      initialState,
      new ContentListStateActions.UpdateSearchResult(
        createPublishedEntityConnection(['2'], { hasPreviousPage: false, hasNextPage: true }),
        undefined,
      ),
    );
    expect(loadedState).toMatchSnapshot('2 - loaded');

    expect(initialState.entitiesScrollToTopSignal).toEqual(loadedState.entitiesScrollToTopSignal);
  });
});
