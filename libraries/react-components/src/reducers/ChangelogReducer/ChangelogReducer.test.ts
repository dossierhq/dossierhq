import type { ChangelogEvent, Connection, Edge, ErrorType } from '@dossierhq/core';
import { EventType, ok } from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import type { ChangelogState, ChangelogStateAction } from './ChangelogReducer.js';
import {
  ChangelogStateActions,
  initializeChangelogState,
  reduceChangelogState,
} from './ChangelogReducer.js';

function createNode(): ChangelogEvent {
  return {
    type: EventType.updateSchema,
    createdBy: '123',
    createdAt: new Date('2022-03-19T07:51:25.56Z'),
    version: 1,
  };
}

function createConnection(
  cursorIds: string[],
  { hasPreviousPage, hasNextPage }: { hasPreviousPage: boolean; hasNextPage: boolean },
): Connection<Edge<ChangelogEvent, ErrorType>> {
  return {
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: `cursor-${cursorIds[0]}`,
      endCursor: `cursor-${cursorIds[cursorIds.length - 1]}`,
    },
    edges: cursorIds.map((id) => ({
      cursor: `cursor-${id}`,
      node: ok(createNode()),
    })),
  };
}

function reduceChangelogStateActions(state: ChangelogState, ...actions: ChangelogStateAction[]) {
  let newState = state;
  for (const action of actions) {
    newState = reduceChangelogState(newState, action);
  }
  return newState;
}

describe('initializeChangelogState', () => {
  test('default', () => {
    expect(initializeChangelogState({})).toMatchInlineSnapshot(`
      {
        "connection": undefined,
        "connectionError": undefined,
        "edges": null,
        "loadingState": "",
        "paging": {},
        "query": {
          "reverse": true,
        },
        "requestedCount": 25,
        "scrollToTopSignal": 0,
        "totalCount": null,
      }
    `);
  });
});

describe('ChangelogStateActions.SetQuery', () => {
  test('Resets paging (when configured)', () => {
    const state = reduceChangelogState(
      initializeChangelogState({
        actions: [new ChangelogStateActions.SetPaging({ after: 'cursor', first: 10 }, 'next-page')],
      }),
      new ChangelogStateActions.SetQuery(
        { reverse: false },
        { partial: true, resetPagingIfModifying: true },
      ),
    );
    expect(state.query).toEqual({ reverse: false });
    expect(state.paging).toEqual({});
  });
});

describe('ChangelogStateActions.SetPaging', () => {
  test('Empty paging', () => {
    const state = reduceChangelogState(
      initializeChangelogState({}),
      new ChangelogStateActions.SetPaging({}),
    );
    expect(state.paging).toEqual({});
  });
});

describe('ChangelogStateActions scenarios', () => {
  test('Next page -> loading -> loaded', () => {
    const initialState = initializeChangelogState({
      actions: [
        new ChangelogStateActions.SetPaging({ first: 1 }),
        new ChangelogStateActions.UpdateSearchResult(
          createConnection(['1'], { hasPreviousPage: false, hasNextPage: true }),
          undefined,
        ),
        new ChangelogStateActions.UpdateTotalCount(2),
      ],
    });
    expect(initialState).toMatchSnapshot('1 - initial');

    const loadingState = reduceChangelogStateActions(
      initialState,
      new ChangelogStateActions.SetPaging({ after: 'cursor-1' }, 'next-page'),
      new ChangelogStateActions.UpdateSearchResult(undefined, undefined),
    );
    expect(loadingState).toMatchSnapshot('2 - loading');

    const loadedState = reduceChangelogState(
      loadingState,
      new ChangelogStateActions.UpdateSearchResult(
        createConnection(['2'], { hasPreviousPage: true, hasNextPage: false }),
        undefined,
      ),
    );
    expect(loadedState).toMatchSnapshot('3 - loaded');

    expect(initialState.scrollToTopSignal).toBeLessThan(loadedState.scrollToTopSignal);
  });

  test('Refresh', () => {
    const initialState = initializeChangelogState({
      actions: [
        new ChangelogStateActions.SetPaging({ first: 1 }),
        new ChangelogStateActions.UpdateSearchResult(
          createConnection(['1'], { hasPreviousPage: false, hasNextPage: true }),
          undefined,
        ),
        new ChangelogStateActions.UpdateTotalCount(2),
      ],
    });
    expect(initialState).toMatchSnapshot('1 - initial');

    const loadedState = reduceChangelogStateActions(
      initialState,
      new ChangelogStateActions.UpdateSearchResult(
        createConnection(['2'], { hasPreviousPage: false, hasNextPage: true }),
        undefined,
      ),
    );
    expect(loadedState).toMatchSnapshot('2 - loaded');

    expect(initialState.scrollToTopSignal).toEqual(loadedState.scrollToTopSignal);
  });
});
