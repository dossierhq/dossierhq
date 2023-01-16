import { describe, expect, test } from 'vitest';
import type { EntityDisplayState, EntityDisplayStateAction } from './EntityDisplayReducer.js';
import {
  EntityDisplayActions,
  initializeEntityDisplayState,
  reduceEntityDisplayState,
} from './EntityDisplayReducer.js';

function reduceEntityDisplayStateActions(
  state: EntityDisplayState,
  ...actions: EntityDisplayStateAction[]
) {
  let newState = state;
  for (const action of actions) {
    newState = reduceEntityDisplayState(newState, action);
  }
  return newState;
}

describe('initializeEntityDisplayState', () => {
  test('no args', () => {
    expect(initializeEntityDisplayState([])).toMatchSnapshot();
  });
});

describe('AddEntityAction', () => {
  test('add new id', () => {
    const id = 'cf05e3cc-ccda-4ff3-a46b-c02ac9659798';
    const state = reduceEntityDisplayState(
      initializeEntityDisplayState([]),
      new EntityDisplayActions.AddEntity(id)
    );

    expect(state).toMatchSnapshot();
  });

  test('add existing id', () => {
    const id = 'cf05e3cc-ccda-4ff3-a46b-c02ac9659798';
    const state = reduceEntityDisplayState(
      initializeEntityDisplayState([id]),
      new EntityDisplayActions.AddEntity(id)
    );

    expect(state).toMatchSnapshot();
    expect(state.entityIds).toEqual([id]);
  });
});

describe('RemoveEntityAction', () => {
  test('add/delete Foo', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityDisplayStateActions(
      initializeEntityDisplayState([]),
      new EntityDisplayActions.AddEntity(id),
      new EntityDisplayActions.RemoveEntity(id)
    );
    expect(state).toMatchSnapshot();
    expect(state.entityIds).toHaveLength(0);
    expect(state.activeEntityId).toBeNull();
  });
});

describe('SetActiveEntityAction', () => {
  test('add two entities, set active to first', () => {
    const state = reduceEntityDisplayStateActions(
      initializeEntityDisplayState([]),
      new EntityDisplayActions.AddEntity('619725d7-e583-4544-8bb0-23fc3c2870c0'),
      new EntityDisplayActions.AddEntity('9516465b-935a-4cc7-8b97-ccaca81bbe9a'),
      new EntityDisplayActions.SetActiveEntity('619725d7-e583-4544-8bb0-23fc3c2870c0', true, true)
    );
    expect(state).toMatchSnapshot();
    expect(state.activeEntityId).toBe('619725d7-e583-4544-8bb0-23fc3c2870c0');
  });
});
