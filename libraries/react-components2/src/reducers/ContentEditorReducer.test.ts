import {
  copyEntity,
  EntityStatus,
  FieldType,
  Schema,
  SchemaWithMigrations,
  type Entity,
} from '@dossierhq/core';
import { assert, describe, expect, test } from 'vitest';
import {
  ContentEditorActions,
  getEntityCreateFromDraftState,
  getEntityUpdateFromDraftState,
  initializeContentEditorState,
  reduceContentEditorState,
  type ContentEditorState,
  type ContentEditorStateAction,
} from './ContentEditorReducer.js';

function reduceContentEditorStateActions(
  state: ContentEditorState,
  ...actions: ContentEditorStateAction[]
) {
  let newState = state;
  for (const action of actions) {
    newState = reduceContentEditorState(newState, action);
  }
  return newState;
}

describe('initializeContentEditorState', () => {
  test('no args', () => {
    const state = initializeContentEditorState();
    expect(state).toMatchInlineSnapshot(`
      {
        "activeEntityEditorScrollSignal": 0,
        "activeEntityId": null,
        "activeEntityMenuScrollSignal": 0,
        "drafts": [],
        "pendingSchemaActions": null,
        "schema": null,
        "showOpenDialog": false,
        "status": "",
      }
    `);
  });

  test('add draft', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = initializeContentEditorState({
      actions: [new ContentEditorActions.AddDraft({ id })],
    });
    expect(state).toMatchInlineSnapshot(`
      {
        "activeEntityEditorScrollSignal": 0,
        "activeEntityId": null,
        "activeEntityMenuScrollSignal": 0,
        "drafts": [],
        "pendingSchemaActions": [
          AddDraftAction {
            "selector": {
              "id": "619725d7-e583-4544-8bb0-23fc3c2870c0",
            },
          },
        ],
        "schema": null,
        "showOpenDialog": false,
        "status": "",
      }
    `);
  });

  test('add new entity', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = initializeContentEditorState({
      actions: [new ContentEditorActions.AddDraft({ id, newType: 'Foo' })],
    });
    expect(state).toMatchInlineSnapshot(`
      {
        "activeEntityEditorScrollSignal": 0,
        "activeEntityId": null,
        "activeEntityMenuScrollSignal": 0,
        "drafts": [],
        "pendingSchemaActions": [
          AddDraftAction {
            "selector": {
              "id": "619725d7-e583-4544-8bb0-23fc3c2870c0",
              "newType": "Foo",
            },
          },
        ],
        "schema": null,
        "showOpenDialog": false,
        "status": "",
      }
    `);
  });
});

describe('AddDraftAction', () => {
  test('add new Foo', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [{ name: 'title', type: FieldType.String }] }],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id, newType: 'Foo' }),
    );
    expect(state).toMatchSnapshot();
  });

  test('add already open Foo', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id }),
      new ContentEditorActions.UpdateEntity({
        id,
        info: {
          authKey: '',
          name: 'Foo',
          type: 'Foo',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-05-01T07:51:25.56Z'),
          version: 1,
        },
        fields: {
          foo: null,
        },
      }),
      new ContentEditorActions.AddDraft({ id }),
    );
    expect(state).toMatchSnapshot();
    expect(state.activeEntityMenuScrollSignal).toBe(2);
    expect(state.activeEntityEditorScrollSignal).toBe(2);
  });
});

describe('DeleteDraftAction', () => {
  test('add/delete Foo', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id, newType: 'Foo' }),
      new ContentEditorActions.SetName(id, 'Changed name'),
      new ContentEditorActions.DeleteDraft(id),
    );
    expect(state).toMatchSnapshot();
    expect(state.status).toBe('');
    expect(state.drafts).toHaveLength(0);
    expect(state.activeEntityId).toBeNull();
  });
});

describe('SetActiveEntityAction', () => {
  test('add two entities, set active to first', () => {
    const state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            { name: 'Foo', fields: [] },
            { name: 'Bar', fields: [] },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({
        id: '619725d7-e583-4544-8bb0-23fc3c2870c0',
        newType: 'Foo',
      }),
      new ContentEditorActions.AddDraft({
        id: '9516465b-935a-4cc7-8b97-ccaca81bbe9a',
        newType: 'Bar',
      }),
      new ContentEditorActions.SetActiveEntity('619725d7-e583-4544-8bb0-23fc3c2870c0', true, true),
    );
    expect(state).toMatchSnapshot();
    expect(state.activeEntityId).toBe('619725d7-e583-4544-8bb0-23fc3c2870c0');
  });
});

describe('SetNameAction', () => {
  test('set name of new draft', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id, newType: 'Foo' }),
      new ContentEditorActions.SetName(id, 'New name'),
    );
    expect(state).toMatchSnapshot();

    const draftState = state.drafts.find((it) => it.id === id);
    assert(draftState);
    expect(draftState.draft?.name).toEqual('New name');
    expect(draftState.status).toEqual('changed');
    expect(draftState.draft?.nameIsLinkedToField).toBe(false);
  });

  test('clearing name of new draft links to name field', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              nameField: 'title',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id, newType: 'Foo' }),
      new ContentEditorActions.SetName(id, 'New name'),
      new ContentEditorActions.SetName(id, ''),
    );
    expect(state).toMatchSnapshot();

    const draftState = state.drafts.find((it) => it.id === id);
    assert(draftState);

    expect(draftState.draft?.nameIsLinkedToField).toBe(true);
  });
});

describe('SetFieldAction', () => {
  test('set title field of new draft', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              nameField: 'title',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id, newType: 'Foo' }),
      new ContentEditorActions.SetField(id, 'title', 'New title'),
    );
    expect(state).toMatchSnapshot();
  });

  test('set title field of new draft after name has been set', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              nameField: 'title',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id, newType: 'Foo' }),
      new ContentEditorActions.SetName(id, 'New name'),
      new ContentEditorActions.SetField(id, 'title', 'New title'),
    );
    expect(state).toMatchSnapshot();
  });

  test('set invalid value (matchPattern) on field of new draft', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'string', type: FieldType.String, matchPattern: 'foo' }],
            },
          ],
          patterns: [{ name: 'foo', pattern: '^foo$' }],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id, newType: 'Foo' }),
      new ContentEditorActions.SetField(id, 'string', 'not-foo'),
    );
    expect(state).toMatchSnapshot();
  });
});

describe('SetAuthKeyAction', () => {
  test('set authKey of new draft', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id, newType: 'Foo' }),
      new ContentEditorActions.SetAuthKey(id, 'subject'),
    );
    expect(state).toMatchSnapshot();
    expect(state.drafts.find((it) => it.id === id)?.draft?.authKey).toEqual('subject');
  });
});

describe('UpdateEntityAction', () => {
  test('add draft, update entity', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              nameField: 'title',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id }),
      new ContentEditorActions.UpdateEntity({
        id,
        info: {
          authKey: '',
          name: 'Foo title#123456',
          type: 'Foo',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-04-30T07:51:25.56Z'),
          version: 1,
        },
        fields: {
          title: 'Foo title',
        },
      }),
    );
    expect(state).toMatchSnapshot();

    const draftState = state.drafts.find((it) => it.id === id);
    assert(draftState);
    expect(draftState.draft?.nameIsLinkedToField).toBe(true);

    expect(getEntityUpdateFromDraftState(draftState)).toMatchSnapshot();
  });

  test('add draft, update entity with unlinked name', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              nameField: 'title',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id }),
      new ContentEditorActions.UpdateEntity({
        id,
        info: {
          authKey: '',
          name: 'Different name',
          type: 'Foo',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-04-30T07:51:25.56Z'),
          version: 1,
        },
        fields: {
          title: 'Foo title',
        },
      }),
    );
    expect(state).toMatchSnapshot();

    const draftState = state.drafts.find((it) => it.id === id);
    assert(draftState);
    expect(draftState.draft?.nameIsLinkedToField).toBe(false);
  });
});

describe('UpdateSchemaSpecificationAction', () => {
  test('add empty schema', () => {
    const state = reduceContentEditorState(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({}).valueOrThrow(),
      ),
    );
    expect(state).toMatchSnapshot();
  });
});

describe('ContentEditorReducer scenarios', () => {
  test('open existing, get schema', async () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    let state = initializeContentEditorState({
      actions: [new ContentEditorActions.AddDraft({ id })],
    });
    expect(state).toMatchSnapshot();
    expect(state.pendingSchemaActions).toHaveLength(1);

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              nameField: 'title',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
    );
    expect(state).toMatchSnapshot();
    expect(state.pendingSchemaActions).toBeNull();

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.UpdateEntity({
        id,
        info: {
          authKey: '',
          name: "Foo's title#123456",
          type: 'Foo',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-04-30T07:51:25.56Z'),
          version: 1,
        },
        fields: {
          title: "Foo's title",
        },
      }),
    );
    expect(state).toMatchSnapshot();
    // Linked since the title field matches the name
    expect(state.drafts[0].draft?.nameIsLinkedToField).toBe(true);
  });

  test('add new draft, set name and authKey, force update', async () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    let state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id, newType: 'Foo' }),
    );
    expect(state).toMatchSnapshot();

    state = reduceContentEditorState(state, new ContentEditorActions.SetName(id, 'Foo name'));
    expect(state).toMatchSnapshot();

    state = reduceContentEditorState(state, new ContentEditorActions.SetAuthKey(id, ''));
    expect(state).toMatchSnapshot();

    expect(
      getEntityCreateFromDraftState(state.drafts.find((it) => it.id === id)!),
    ).toMatchSnapshot();

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.SetNextEntityUpdateIsDueToUpsert(id, true),
    );
    expect(state).toMatchSnapshot();

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.UpdateEntity({
        id,
        info: {
          authKey: '',
          name: 'Foo name#123456',
          type: 'Foo',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-04-30T07:51:25.56Z'),
          version: 1,
        },
        fields: {
          title: null,
        },
      }),
    );
    expect(state).toMatchSnapshot();
  });

  test('add new draft, set name, authKey and title, simulate save', async () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    let state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id, newType: 'Foo' }),
    );
    expect(state).toMatchSnapshot();

    state = reduceContentEditorState(state, new ContentEditorActions.SetName(id, 'Foo name'));
    expect(state).toMatchSnapshot();

    state = reduceContentEditorState(state, new ContentEditorActions.SetAuthKey(id, ''));
    expect(state).toMatchSnapshot();

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.SetField(id, 'title', 'Foo title'),
    );
    expect(state).toMatchSnapshot();

    expect(
      getEntityCreateFromDraftState(state.drafts.find((it) => it.id === id)!),
    ).toMatchSnapshot();

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.SetNextEntityUpdateIsDueToUpsert(id, true),
    );
    expect(state).toMatchSnapshot();

    state = reduceContentEditorState(state, new ContentEditorActions.SetEntityIsNoLongerNew(id));
    expect(state).toMatchSnapshot();

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.UpdateEntity({
        id,
        info: {
          authKey: '',
          name: 'Foo name#123456',
          type: 'Foo',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-04-30T07:51:25.56Z'),
          version: 1,
        },
        fields: {
          title: 'Foo title',
        },
      }),
    );
    expect(state).toMatchSnapshot();
  });

  test('open existing entity, set title field, simulate save', async () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    let state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              nameField: 'title',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id }),
      new ContentEditorActions.UpdateEntity({
        id,
        info: {
          authKey: '',
          name: 'Foo title#123456',
          type: 'Foo',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-04-30T07:51:25.56Z'),
          version: 1,
        },
        fields: {
          title: 'Foo title',
        },
      }),
    );
    expect(state).toMatchSnapshot();

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.SetField(id, 'title', 'New title'),
    );
    expect(state).toMatchSnapshot();

    expect(
      getEntityUpdateFromDraftState(state.drafts.find((it) => it.id === id)!),
    ).toMatchSnapshot();

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.SetNextEntityUpdateIsDueToUpsert(id, true),
    );
    expect(state).toMatchSnapshot();

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.UpdateEntity({
        id,
        info: {
          authKey: '',
          name: 'New title#123456',
          type: 'Foo',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-05-01T07:51:25.56Z'),
          version: 1,
        },
        fields: {
          title: 'New title',
        },
      }),
    );
    expect(state).toMatchSnapshot();
  });

  test('open existing entity, simulate publish', async () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const entity: Entity = {
      id,
      info: {
        authKey: '',
        name: 'Foo name#123456',
        type: 'Foo',
        status: EntityStatus.draft,
        valid: true,
        validPublished: null,
        createdAt: new Date('2022-04-30T07:51:25.56Z'),
        updatedAt: new Date('2022-04-30T07:51:25.56Z'),
        version: 1,
      },
      fields: {
        title: 'Existing title',
      },
    };
    let state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id }),
      new ContentEditorActions.UpdateEntity(entity),
    );
    expect(state).toMatchSnapshot();

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.UpdateEntity(
        copyEntity(entity, {
          info: {
            status: EntityStatus.published,
            updatedAt: new Date('2022-05-01T07:51:25.56Z'),
            validPublished: true,
          },
        }),
      ),
    );
    expect(state).toMatchSnapshot();

    const draftState = state.drafts.find((it) => it.id === id);
    assert(draftState);
    expect(draftState.entity?.info.status).toBe(EntityStatus.published);
    expect(draftState.entity?.info.updatedAt).toEqual(new Date('2022-05-01T07:51:25.56Z'));
  });

  test('open first entity, open second entity', async () => {
    const firstId = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const secondId = 'af83fa2d-e05c-49ef-9e31-61e6472c1f28';
    let state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'foo', type: FieldType.Reference }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id: firstId }),
      new ContentEditorActions.UpdateEntity({
        id: firstId,
        info: {
          authKey: '',
          name: 'Foo name#123456',
          type: 'Foo',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-04-30T07:51:25.56Z'),
          version: 1,
        },
        fields: {
          foo: { id: secondId },
        },
      }),
    );
    expect(state).toMatchSnapshot('1 Initial');
    expect(state.activeEntityMenuScrollSignal).toBe(1);
    expect(state.activeEntityEditorScrollSignal).toBe(1);

    state = reduceContentEditorState(state, new ContentEditorActions.AddDraft({ id: secondId }));
    expect(state).toMatchSnapshot('2 After AddDraft');
    expect(state.activeEntityMenuScrollSignal).toBe(1);
    expect(state.activeEntityEditorScrollSignal).toBe(1);

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.UpdateEntity({
        id: secondId,
        info: {
          authKey: '',
          name: 'Foo 2',
          type: 'Foo',
          status: EntityStatus.draft,
          valid: true,
          validPublished: null,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-05-01T07:51:25.56Z'),
          version: 1,
        },
        fields: {
          foo: null,
        },
      }),
    );
    expect(state).toMatchSnapshot('3 After UpdateEntity');
    expect(state.activeEntityMenuScrollSignal).toBe(2);
    expect(state.activeEntityEditorScrollSignal).toBe(2);
  });

  test('required string fields component place in normal and adminOnly fields', async () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    let state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(
        Schema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [
                { name: 'adminOnly', type: FieldType.Component, adminOnly: true },
                { name: 'normal', type: FieldType.Component },
              ],
            },
          ],
          componentTypes: [
            {
              name: 'RequiredString',
              fields: [{ name: 'required', type: FieldType.String, required: true }],
            },
          ],
        }).valueOrThrow(),
      ),
      new ContentEditorActions.AddDraft({ id, newType: 'Foo' }),
    );
    expect(state).toMatchSnapshot('1 Initial');
    expect(state.drafts[0].hasSaveErrors).toBe(false);
    expect(state.drafts[0].hasPublishErrors).toBe(false);
    expect(state.drafts[0].draft?.fields[0].validationIssues).toEqual([]);
    expect(state.drafts[0].draft?.fields[1].validationIssues).toEqual([]);

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.SetField(id, 'adminOnly', {
        type: 'RequiredString',
        required: null,
      }),
    );
    expect(state).toMatchSnapshot('2 Setting adminOnly field to empty component');
    expect(state.drafts[0].hasSaveErrors).toBe(false);
    expect(state.drafts[0].hasPublishErrors).toBe(false);
    expect(state.drafts[0].draft?.fields[0].validationIssues).toEqual([]);
    expect(state.drafts[0].draft?.fields[1].validationIssues).toEqual([]);

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.SetField(id, 'normal', { type: 'RequiredString', required: null }),
    );
    expect(state).toMatchSnapshot('3 Setting normal field to empty component');
    expect(state.drafts[0].hasSaveErrors).toBe(false);
    expect(state.drafts[0].hasPublishErrors).toBe(true);
    expect(state.drafts[0].draft?.fields[0].validationIssues).toEqual([]);
    expect(state.drafts[0].draft?.fields[1].validationIssues).toEqual([
      { message: 'Required field is empty', path: ['required'], type: 'publish' },
    ]);
  });

  test('renameField of entity field', async () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';

    const initialEntity: Entity = {
      id,
      info: {
        authKey: '',
        name: 'Foo',
        type: 'Foo',
        status: EntityStatus.draft,
        valid: true,
        validPublished: null,
        createdAt: new Date('2022-04-30T07:51:25.56Z'),
        updatedAt: new Date('2022-05-01T07:51:25.56Z'),
        version: 1,
      },
      fields: {
        oldName: 'value',
      },
    };

    const schema = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', fields: [{ name: 'oldName', type: FieldType.String }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameField', entityType: 'Foo', field: 'oldName', newName: 'newName' },
            ],
          },
        ],
      })
      .valueOrThrow();

    let state = reduceContentEditorStateActions(
      initializeContentEditorState(),
      new ContentEditorActions.UpdateSchemaSpecification(schema),
      new ContentEditorActions.AddDraft({ id, newType: 'Foo' }),
      new ContentEditorActions.UpdateEntity(initialEntity),
    );
    expect(state).toMatchSnapshot('1 Initial loaded entity with oldName');

    state = reduceContentEditorState(
      state,
      new ContentEditorActions.UpdateEntity({ ...initialEntity, fields: { newName: 'value' } }),
    );
    expect(state).toMatchSnapshot('2 Loading entity with correct field name');
    expect(state.drafts[0].draft?.fields[0].fieldSpec.name).toBe('newName');
    expect(state.drafts[0].draft?.fields[0].value).toBe('value');
  });
});
