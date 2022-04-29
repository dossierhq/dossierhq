import { AdminEntityStatus, AdminSchema } from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import type { EntityEditorState, EntityEditorStateAction } from './EntityEditorReducer';
import {
  EntityEditorActions,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from './EntityEditorReducer';

function reduceEntityEditorStateActions(
  state: EntityEditorState,
  ...actions: EntityEditorStateAction[]
) {
  let newState = state;
  for (const action of actions) {
    newState = reduceEntityEditorState(newState, action);
  }
  return newState;
}

describe('initializeEntityEditorState', () => {
  test('no args', () => {
    const state = initializeEntityEditorState();
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeEntityId": null,
        "drafts": Array [],
        "schema": null,
        "status": "uninitialized",
      }
    `);
  });
});

describe('AddDraftAction', () => {
  test('add Foo', () => {
    const state = reduceEntityEditorState(
      initializeEntityEditorState(),
      new EntityEditorActions.AddDraft({
        id: '619725d7-e583-4544-8bb0-23fc3c2870c0',
        newType: 'Foo',
      })
    );
    expect(state).toMatchSnapshot();
  });
});

describe('SetActiveEntityAction', () => {
  test('add two entities, set active to first', () => {
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.AddDraft({
        id: '619725d7-e583-4544-8bb0-23fc3c2870c0',
        newType: 'Foo',
      }),
      new EntityEditorActions.AddDraft({
        id: '9516465b-935a-4cc7-8b97-ccaca81bbe9a',
        newType: 'Bar',
      }),
      new EntityEditorActions.SetActiveEntity('619725d7-e583-4544-8bb0-23fc3c2870c0')
    );
    expect(state).toMatchSnapshot();
    expect(state.activeEntityId).toBe('619725d7-e583-4544-8bb0-23fc3c2870c0');
  });
});

describe('UpdateEntityAction', () => {
  test('add draft, update entity', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.AddDraft({ id }),
      new EntityEditorActions.UpdateEntity({
        id,
        info: {
          authKey: 'none',
          name: 'Foo name',
          type: 'Foo',
          status: AdminEntityStatus.draft,
          createdAt: Temporal.Instant.from('2022-04-30T07:51:25.56Z'),
          updatedAt: Temporal.Instant.from('2022-04-30T07:51:25.56Z'),
          version: 0,
        },
        fields: {
          title: 'Title',
        },
      })
    );
    expect(state).toMatchSnapshot();
  });
});

describe('UpdateSchemaSpecificationAction', () => {
  test('add empty schema', () => {
    const state = reduceEntityEditorState(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        new AdminSchema({ entityTypes: [], valueTypes: [] })
      )
    );
    expect(state).toMatchSnapshot();
  });
});
