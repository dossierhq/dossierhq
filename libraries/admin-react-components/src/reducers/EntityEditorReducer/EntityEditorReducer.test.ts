import { AdminEntityStatus, AdminSchema, FieldType } from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import type { EntityEditorState, EntityEditorStateAction } from './EntityEditorReducer';
import {
  EntityEditorActions,
  getEntityCreateFromDraftState,
  getEntityUpdateFromDraftState,
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
        "activeEntityEditorScrollSignal": 0,
        "activeEntityId": null,
        "activeEntityMenuScrollSignal": 0,
        "drafts": Array [],
        "schema": null,
        "status": "",
      }
    `);
  });
});

describe('AddDraftAction', () => {
  test('add Foo', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [
            { name: 'Foo', adminOnly: false, fields: [{ name: 'title', type: FieldType.String }] },
          ],
          valueTypes: [],
        })
      ),
      new EntityEditorActions.AddDraft({ id, newType: 'Foo' })
    );
    expect(state).toMatchSnapshot();
  });
});

describe('SetActiveEntityAction', () => {
  test('add two entities, set active to first', () => {
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [
            { name: 'Foo', adminOnly: false, fields: [] },
            { name: 'Bar', adminOnly: false, fields: [] },
          ],
          valueTypes: [],
        })
      ),
      new EntityEditorActions.AddDraft({
        id: '619725d7-e583-4544-8bb0-23fc3c2870c0',
        newType: 'Foo',
      }),
      new EntityEditorActions.AddDraft({
        id: '9516465b-935a-4cc7-8b97-ccaca81bbe9a',
        newType: 'Bar',
      }),
      new EntityEditorActions.SetActiveEntity('619725d7-e583-4544-8bb0-23fc3c2870c0', true, true)
    );
    expect(state).toMatchSnapshot();
    expect(state.activeEntityId).toBe('619725d7-e583-4544-8bb0-23fc3c2870c0');
  });
});

describe('SetNameAction', () => {
  test('set name of new draft', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [
            { name: 'Foo', adminOnly: false, fields: [{ name: 'title', type: FieldType.String }] },
          ],
          valueTypes: [],
        })
      ),
      new EntityEditorActions.AddDraft({ id, newType: 'Foo' }),
      new EntityEditorActions.SetName(id, 'New name')
    );
    expect(state).toMatchSnapshot();
    expect(state.drafts.find((it) => it.id === id)?.draft?.name).toEqual('New name');
  });
});

describe('SetAuthKeyAction', () => {
  test('set authKey of new draft', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [
            { name: 'Foo', adminOnly: false, fields: [{ name: 'title', type: FieldType.String }] },
          ],
          valueTypes: [],
        })
      ),
      new EntityEditorActions.AddDraft({ id, newType: 'Foo' }),
      new EntityEditorActions.SetAuthKey(id, 'subject')
    );
    expect(state).toMatchSnapshot();
    expect(state.drafts.find((it) => it.id === id)?.draft?.authKey).toEqual('subject');
  });
});

describe('UpdateEntityAction', () => {
  test('add draft, update entity', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [
            { name: 'Foo', adminOnly: false, fields: [{ name: 'title', type: FieldType.String }] },
          ],
          valueTypes: [],
        })
      ),
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

    expect(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      getEntityUpdateFromDraftState(state.drafts.find((it) => it.id === id)!)
    ).toMatchSnapshot();
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

describe('EntityEditorReducer scenarios', () => {
  test('add new draft, set name and authKey, force update', async () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const stateAfterAddingDraft = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [
            {
              name: 'Foo',
              adminOnly: false,
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
          valueTypes: [],
        })
      ),
      new EntityEditorActions.AddDraft({ id, newType: 'Foo' })
    );
    expect(stateAfterAddingDraft).toMatchSnapshot();

    const stateAfterSetName = reduceEntityEditorState(
      stateAfterAddingDraft,
      new EntityEditorActions.SetName(id, 'Foo name')
    );
    expect(stateAfterSetName).toMatchSnapshot();

    const stateAfterSetAuthKey = reduceEntityEditorState(
      stateAfterSetName,
      new EntityEditorActions.SetAuthKey(id, 'none')
    );
    expect(stateAfterSetAuthKey).toMatchSnapshot();

    expect(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      getEntityCreateFromDraftState(stateAfterSetAuthKey.drafts.find((it) => it.id === id)!)
    ).toMatchSnapshot();

    const stateAfterMarkForUpsert = reduceEntityEditorState(
      stateAfterSetAuthKey,
      new EntityEditorActions.SetNextEntityUpdateIsDueToUpsert(id, true)
    );
    expect(stateAfterMarkForUpsert).toMatchSnapshot();

    const stateAfterEntityUpdate = reduceEntityEditorState(
      stateAfterMarkForUpsert,
      new EntityEditorActions.UpdateEntity({
        id,
        info: {
          authKey: 'none',
          name: 'Foo name#123456',
          type: 'Foo',
          status: AdminEntityStatus.draft,
          createdAt: Temporal.Instant.from('2022-04-30T07:51:25.56Z'),
          updatedAt: Temporal.Instant.from('2022-04-30T07:51:25.56Z'),
          version: 0,
        },
        fields: {
          title: null,
        },
      })
    );
    expect(stateAfterEntityUpdate).toMatchSnapshot();
  });
});
