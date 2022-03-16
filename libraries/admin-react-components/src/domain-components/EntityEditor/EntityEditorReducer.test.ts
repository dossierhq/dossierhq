import { AdminEntityStatus } from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import schema from '../../stories/StoryboardSchema';
import { bar1Id } from '../../test/EntityFixtures';
import { insecureTestUuidv4 } from '../../test/TestUtils';
import type { EntityEditorState } from './EntityEditorReducer';
import {
  AddEntityDraftAction,
  initializeEntityEditorState,
  reduceEntityEditorState,
  SetNameAction,
  UpdateEntityAction,
} from './EntityEditorReducer';

function newState(): EntityEditorState {
  return initializeEntityEditorState({ schema });
}

function stateWithoutSchema(state: EntityEditorState) {
  const { schema, ...newState } = state;
  newState.drafts = state.drafts.map((draftState) => {
    const newDraftState = { ...draftState };
    if (newDraftState.entity) {
      const { entitySpec, ...newEntity } = newDraftState.entity;
      newEntity.fields = newEntity.fields.map((field) => {
        const { fieldSpec, ...newField } = field;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return newField as any;
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newDraftState.entity = newEntity as any;
    }
    return newDraftState;
  });
  return newState;
}

describe('reduceEntityEditorState', () => {
  test('AddDraftAction new entity', async () => {
    const id = 'e4e78fce-1089-41b8-9b6b-440d2e044061';
    let state = newState();
    state = reduceEntityEditorState(state, new AddEntityDraftAction({ id, newType: 'Foo' }));
    expect(stateWithoutSchema(state)).toMatchSnapshot();
  });

  test('SetNameAction new entity', () => {
    const id = insecureTestUuidv4();
    let state = newState();
    state = reduceEntityEditorState(state, new AddEntityDraftAction({ id, newType: 'Foo' }));
    state = reduceEntityEditorState(state, new SetNameAction(id, 'New name'));
    expect(state.drafts[0].entity?.name).toEqual('New name');
  });

  test('UpdateEntityAction', async () => {
    let state = newState();
    state = reduceEntityEditorState(state, new AddEntityDraftAction({ id: bar1Id }));
    state = reduceEntityEditorState(
      state,
      new UpdateEntityAction(bar1Id, {
        id: bar1Id,
        info: {
          type: 'Bar',
          authKey: 'none',
          createdAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
          updatedAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
          name: 'Hello',
          version: 0,
          status: AdminEntityStatus.draft,
        },
        fields: { title: 'Hello' },
      })
    );
    expect(stateWithoutSchema(state)).toMatchSnapshot();
  });
});
