import { AdminQueryOrder } from '@jonasb/datadata-core';
import {
  initializeSearchEntityState,
  reduceSearchEntityState,
  SearchEntityStateActions,
} from './SearchEntityReducer';

describe('initializeSearchEntityState', () => {
  test('default', () => {
    expect(initializeSearchEntityState([])).toMatchInlineSnapshot(`
      Object {
        "connection": undefined,
        "connectionError": undefined,
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
        { partial: true, resetPaging: true }
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
        { partial: true, resetPaging: true }
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
          { partial: true, resetPaging: true }
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
