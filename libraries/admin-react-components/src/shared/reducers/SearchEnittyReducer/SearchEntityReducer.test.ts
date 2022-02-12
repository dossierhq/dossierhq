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
        "paging": Object {},
        "pagingCount": 25,
        "query": Object {
          "order": "name",
        },
        "sample": false,
        "sampling": Object {},
        "text": "",
        "totalCount": null,
      }
    `);
  });
});

describe('SearchEntityStateActions.SetSampling', () => {
  test('Empty sampling', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState([]),
      new SearchEntityStateActions.SetSampling({})
    );
    expect(state.sampling).toEqual({});
  });
});

describe('SearchEntityStateActions.SetSample', () => {
  test('false->true', () => {
    const state = reduceSearchEntityState(
      initializeSearchEntityState([]),
      new SearchEntityStateActions.SetSample(true)
    );
    expect(state.sample).toBeTruthy();
  });
});
