import type { AdminEntity } from '@dossierhq/core';
import {
  AdminEntityStatus,
  AdminSchema,
  assertIsDefined,
  copyEntity,
  FieldType,
} from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import type { EntityEditorState, EntityEditorStateAction } from './EntityEditorReducer.js';
import {
  EntityEditorActions,
  getEntityCreateFromDraftState,
  getEntityUpdateFromDraftState,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from './EntityEditorReducer.js';

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
      {
        "activeEntityEditorScrollSignal": 0,
        "activeEntityId": null,
        "activeEntityMenuScrollSignal": 0,
        "drafts": [],
        "pendingSchemaActions": null,
        "schema": null,
        "status": "",
      }
    `);
  });

  test('add draft', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = initializeEntityEditorState({
      actions: [new EntityEditorActions.AddDraft({ id })],
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
        "status": "",
      }
    `);
  });

  test('add new entity', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = initializeEntityEditorState({
      actions: [new EntityEditorActions.AddDraft({ id, newType: 'Foo' })],
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
        "status": "",
      }
    `);
  });
});

describe('AddDraftAction', () => {
  test('add new Foo', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [{ name: 'title', type: FieldType.String }] }],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id, newType: 'Foo' })
    );
    expect(state).toMatchSnapshot();
  });

  test('add already open Foo', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id }),
      new EntityEditorActions.UpdateEntity({
        id,
        info: {
          authKey: 'none',
          name: 'Foo',
          type: 'Foo',
          status: AdminEntityStatus.draft,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-05-01T07:51:25.56Z'),
          version: 0,
        },
        fields: {
          foo: null,
        },
      }),
      new EntityEditorActions.AddDraft({ id })
    );
    expect(state).toMatchSnapshot();
    expect(state.activeEntityMenuScrollSignal).toBe(2);
    expect(state.activeEntityEditorScrollSignal).toBe(2);
  });
});

describe('DeleteDraftAction', () => {
  test('add/delete Foo', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id, newType: 'Foo' }),
      new EntityEditorActions.SetName(id, 'Changed name'),
      new EntityEditorActions.DeleteDraft(id)
    );
    expect(state).toMatchSnapshot();
    expect(state.status).toBe('');
    expect(state.drafts).toHaveLength(0);
    expect(state.activeEntityId).toBeNull();
  });
});

describe('SetActiveEntityAction', () => {
  test('add two entities, set active to first', () => {
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            { name: 'Foo', fields: [] },
            { name: 'Bar', fields: [] },
          ],
        }).valueOrThrow()
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
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id, newType: 'Foo' }),
      new EntityEditorActions.SetName(id, 'New name')
    );
    expect(state).toMatchSnapshot();

    const draftState = state.drafts.find((it) => it.id === id);
    assertIsDefined(draftState);
    expect(draftState.draft?.name).toEqual('New name');
    expect(draftState.status).toEqual('changed');
    expect(draftState.draft?.nameIsLinkedToField).toBe(false);
  });

  test('clearing name of enw draft links to name field', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String, isName: true }],
            },
          ],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id, newType: 'Foo' }),
      new EntityEditorActions.SetName(id, 'New name'),
      new EntityEditorActions.SetName(id, '')
    );
    expect(state).toMatchSnapshot();

    const draftState = state.drafts.find((it) => it.id === id);
    assertIsDefined(draftState);

    expect(draftState.draft?.nameIsLinkedToField).toBe(true);
  });
});

describe('SetFieldAction', () => {
  test('set title field of new draft', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String, isName: true }],
            },
          ],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id, newType: 'Foo' }),
      new EntityEditorActions.SetField(id, 'title', 'New title')
    );
    expect(state).toMatchSnapshot();
  });

  test('set title field of new draft after name has been set', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String, isName: true }],
            },
          ],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id, newType: 'Foo' }),
      new EntityEditorActions.SetName(id, 'New name'),
      new EntityEditorActions.SetField(id, 'title', 'New title')
    );
    expect(state).toMatchSnapshot();
  });

  test('set invalid value (matchPattern) on field of new draft', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'string', type: FieldType.String, matchPattern: 'foo' }],
            },
          ],
          patterns: [{ name: 'foo', pattern: '^foo$' }],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id, newType: 'Foo' }),
      new EntityEditorActions.SetField(id, 'string', 'not-foo')
    );
    expect(state).toMatchSnapshot();
  });
});

describe('SetAuthKeyAction', () => {
  test('set authKey of new draft', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow()
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
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String, isName: true }],
            },
          ],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id }),
      new EntityEditorActions.UpdateEntity({
        id,
        info: {
          authKey: 'none',
          name: 'Foo title#123456',
          type: 'Foo',
          status: AdminEntityStatus.draft,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-04-30T07:51:25.56Z'),
          version: 0,
        },
        fields: {
          title: 'Foo title',
        },
      })
    );
    expect(state).toMatchSnapshot();

    const draftState = state.drafts.find((it) => it.id === id);
    assertIsDefined(draftState);
    expect(draftState.draft?.nameIsLinkedToField).toBe(true);

    expect(getEntityUpdateFromDraftState(draftState)).toMatchSnapshot();
  });

  test('add draft, update entity with unlinked name', () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String, isName: true }],
            },
          ],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id }),
      new EntityEditorActions.UpdateEntity({
        id,
        info: {
          authKey: 'none',
          name: 'Different name',
          type: 'Foo',
          status: AdminEntityStatus.draft,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-04-30T07:51:25.56Z'),
          version: 0,
        },
        fields: {
          title: 'Foo title',
        },
      })
    );
    expect(state).toMatchSnapshot();

    const draftState = state.drafts.find((it) => it.id === id);
    assertIsDefined(draftState);
    expect(draftState.draft?.nameIsLinkedToField).toBe(false);
  });
});

describe('UpdateSchemaSpecificationAction', () => {
  test('add empty schema', () => {
    const state = reduceEntityEditorState(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
      )
    );
    expect(state).toMatchSnapshot();
  });
});

describe('EntityEditorReducer scenarios', () => {
  test('open existing, get schema', async () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    let state = initializeEntityEditorState({
      actions: [new EntityEditorActions.AddDraft({ id })],
    });
    expect(state).toMatchSnapshot();
    expect(state.pendingSchemaActions).toHaveLength(1);

    state = reduceEntityEditorState(
      state,
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String, isName: true }],
            },
          ],
        }).valueOrThrow()
      )
    );
    expect(state).toMatchSnapshot();
    expect(state.pendingSchemaActions).toBeNull();

    state = reduceEntityEditorState(
      state,
      new EntityEditorActions.UpdateEntity({
        id,
        info: {
          authKey: 'none',
          name: "Foo's title#123456",
          type: 'Foo',
          status: AdminEntityStatus.draft,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-04-30T07:51:25.56Z'),
          version: 0,
        },
        fields: {
          title: "Foo's title",
        },
      })
    );
    expect(state).toMatchSnapshot();
    // Linked since the title field matches the name
    expect(state.drafts[0].draft?.nameIsLinkedToField).toBe(true);
  });

  test('add new draft, set name and authKey, force update', async () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    let state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id, newType: 'Foo' })
    );
    expect(state).toMatchSnapshot();

    state = reduceEntityEditorState(state, new EntityEditorActions.SetName(id, 'Foo name'));
    expect(state).toMatchSnapshot();

    state = reduceEntityEditorState(state, new EntityEditorActions.SetAuthKey(id, 'none'));
    expect(state).toMatchSnapshot();

    expect(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      getEntityCreateFromDraftState(state.drafts.find((it) => it.id === id)!)
    ).toMatchSnapshot();

    state = reduceEntityEditorState(
      state,
      new EntityEditorActions.SetNextEntityUpdateIsDueToUpsert(id, true)
    );
    expect(state).toMatchSnapshot();

    state = reduceEntityEditorState(
      state,
      new EntityEditorActions.UpdateEntity({
        id,
        info: {
          authKey: 'none',
          name: 'Foo name#123456',
          type: 'Foo',
          status: AdminEntityStatus.draft,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-04-30T07:51:25.56Z'),
          version: 0,
        },
        fields: {
          title: null,
        },
      })
    );
    expect(state).toMatchSnapshot();
  });

  test('add new draft, set name, authKey and title, simulate save', async () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    let state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id, newType: 'Foo' })
    );
    expect(state).toMatchSnapshot();

    state = reduceEntityEditorState(state, new EntityEditorActions.SetName(id, 'Foo name'));
    expect(state).toMatchSnapshot();

    state = reduceEntityEditorState(state, new EntityEditorActions.SetAuthKey(id, 'none'));
    expect(state).toMatchSnapshot();

    state = reduceEntityEditorState(
      state,
      new EntityEditorActions.SetField(id, 'title', 'Foo title')
    );
    expect(state).toMatchSnapshot();

    expect(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      getEntityCreateFromDraftState(state.drafts.find((it) => it.id === id)!)
    ).toMatchSnapshot();

    state = reduceEntityEditorState(
      state,
      new EntityEditorActions.SetNextEntityUpdateIsDueToUpsert(id, true)
    );
    expect(state).toMatchSnapshot();

    state = reduceEntityEditorState(
      state,
      new EntityEditorActions.UpdateEntity({
        id,
        info: {
          authKey: 'none',
          name: 'Foo name#123456',
          type: 'Foo',
          status: AdminEntityStatus.draft,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-04-30T07:51:25.56Z'),
          version: 0,
        },
        fields: {
          title: 'Foo title',
        },
      })
    );
    expect(state).toMatchSnapshot();
  });

  test('open existing entity, set title field, simulate save', async () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    let state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String, isName: true }],
            },
          ],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id }),
      new EntityEditorActions.UpdateEntity({
        id,
        info: {
          authKey: 'none',
          name: 'Foo title#123456',
          type: 'Foo',
          status: AdminEntityStatus.draft,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-04-30T07:51:25.56Z'),
          version: 0,
        },
        fields: {
          title: 'Foo title',
        },
      })
    );
    expect(state).toMatchSnapshot();

    state = reduceEntityEditorState(
      state,
      new EntityEditorActions.SetField(id, 'title', 'New title')
    );
    expect(state).toMatchSnapshot();

    expect(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      getEntityUpdateFromDraftState(state.drafts.find((it) => it.id === id)!)
    ).toMatchSnapshot();

    state = reduceEntityEditorState(
      state,
      new EntityEditorActions.SetNextEntityUpdateIsDueToUpsert(id, true)
    );
    expect(state).toMatchSnapshot();

    state = reduceEntityEditorState(
      state,
      new EntityEditorActions.UpdateEntity({
        id,
        info: {
          authKey: 'none',
          name: 'New title#123456',
          type: 'Foo',
          status: AdminEntityStatus.draft,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-05-01T07:51:25.56Z'),
          version: 1,
        },
        fields: {
          title: 'New title',
        },
      })
    );
    expect(state).toMatchSnapshot();
  });

  test('open existing entity, simulate publish', async () => {
    const id = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const entity: AdminEntity = {
      id,
      info: {
        authKey: 'none',
        name: 'Foo name#123456',
        type: 'Foo',
        status: AdminEntityStatus.draft,
        createdAt: new Date('2022-04-30T07:51:25.56Z'),
        updatedAt: new Date('2022-04-30T07:51:25.56Z'),
        version: 0,
      },
      fields: {
        title: 'Existing title',
      },
    };
    let state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id }),
      new EntityEditorActions.UpdateEntity(entity)
    );
    expect(state).toMatchSnapshot();

    state = reduceEntityEditorState(
      state,
      new EntityEditorActions.UpdateEntity(
        copyEntity(entity, {
          info: {
            status: AdminEntityStatus.published,
            updatedAt: new Date('2022-05-01T07:51:25.56Z'),
          },
        })
      )
    );
    expect(state).toMatchSnapshot();

    const draftState = state.drafts.find((it) => it.id === id);
    assertIsDefined(draftState);
    expect(draftState.entity?.info.status).toBe(AdminEntityStatus.published);
    expect(draftState.entity?.info.updatedAt).toEqual(new Date('2022-05-01T07:51:25.56Z'));
  });

  test('open first entity, open second entity', async () => {
    const firstId = '619725d7-e583-4544-8bb0-23fc3c2870c0';
    const secondId = 'af83fa2d-e05c-49ef-9e31-61e6472c1f28';
    let state = reduceEntityEditorStateActions(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'foo', type: FieldType.Entity }],
            },
          ],
        }).valueOrThrow()
      ),
      new EntityEditorActions.AddDraft({ id: firstId }),
      new EntityEditorActions.UpdateEntity({
        id: firstId,
        info: {
          authKey: 'none',
          name: 'Foo name#123456',
          type: 'Foo',
          status: AdminEntityStatus.draft,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-04-30T07:51:25.56Z'),
          version: 0,
        },
        fields: {
          foo: { id: secondId },
        },
      })
    );
    expect(state).toMatchSnapshot('1 Initial');
    expect(state.activeEntityMenuScrollSignal).toBe(1);
    expect(state.activeEntityEditorScrollSignal).toBe(1);

    state = reduceEntityEditorState(state, new EntityEditorActions.AddDraft({ id: secondId }));
    expect(state).toMatchSnapshot('2 After AddDraft');
    expect(state.activeEntityMenuScrollSignal).toBe(1);
    expect(state.activeEntityEditorScrollSignal).toBe(1);

    state = reduceEntityEditorState(
      state,
      new EntityEditorActions.UpdateEntity({
        id: secondId,
        info: {
          authKey: 'none',
          name: 'Foo 2',
          type: 'Foo',
          status: AdminEntityStatus.draft,
          createdAt: new Date('2022-04-30T07:51:25.56Z'),
          updatedAt: new Date('2022-05-01T07:51:25.56Z'),
          version: 0,
        },
        fields: {
          foo: null,
        },
      })
    );
    expect(state).toMatchSnapshot('3 After UpdateEntity');
    expect(state.activeEntityMenuScrollSignal).toBe(2);
    expect(state.activeEntityEditorScrollSignal).toBe(2);
  });
});