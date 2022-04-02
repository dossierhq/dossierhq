import { AdminSchema, FieldType } from '@jonasb/datadata-core';
import type { SchemaEditorState, SchemaEditorStateAction } from './SchemaEditorReducer';
import {
  getSchemaSpecificationUpdateFromEditorState,
  initializeSchemaEditorState,
  reduceSchemaEditorState,
  SchemaEditorActions,
} from './SchemaEditorReducer';

function reduceSchemaEditorStateActions(
  state: SchemaEditorState,
  ...actions: SchemaEditorStateAction[]
) {
  let newState = state;
  for (const action of actions) {
    newState = reduceSchemaEditorState(newState, action);
  }
  return newState;
}

describe('initializeSchemaEditorState', () => {
  test('no args', () => {
    expect(initializeSchemaEditorState()).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [],
        "schema": null,
        "status": "uninitialized",
        "valueTypes": Array [],
      }
    `);
  });
});

describe('AddEntityTypeAction', () => {
  test('add type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({ entityTypes: [], valueTypes: [] })
      ),
      new SchemaEditorActions.AddEntityType('Foo')
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [],
            "name": "Foo",
            "status": "new",
            "type": "entity",
          },
        ],
        "schema": AdminSchema {
          "spec": Object {
            "entityTypes": Array [],
            "valueTypes": Array [],
          },
        },
        "status": "changed",
        "valueTypes": Array [],
      }
    `);
  });

  test('add two types (orders)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({ entityTypes: [], valueTypes: [] })
      ),
      new SchemaEditorActions.AddEntityType('ZooKeeper'),
      new SchemaEditorActions.AddEntityType('Anaconda')
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [],
            "name": "Anaconda",
            "status": "new",
            "type": "entity",
          },
          Object {
            "fields": Array [],
            "name": "ZooKeeper",
            "status": "new",
            "type": "entity",
          },
        ],
        "schema": AdminSchema {
          "spec": Object {
            "entityTypes": Array [],
            "valueTypes": Array [],
          },
        },
        "status": "changed",
        "valueTypes": Array [],
      }
    `);
  });
});

describe('AddEntityTypeFieldAction', () => {
  test('add field to existing type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.AddEntityTypeField('Foo', 'bar')
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [
              Object {
                "list": false,
                "name": "bar",
                "status": "new",
                "type": "String",
              },
            ],
            "name": "Foo",
            "status": "changed",
            "type": "entity",
          },
        ],
        "schema": AdminSchema {
          "spec": Object {
            "entityTypes": Array [
              Object {
                "adminOnly": false,
                "fields": Array [],
                "name": "Foo",
              },
            ],
            "valueTypes": Array [],
          },
        },
        "status": "",
        "valueTypes": Array [],
      }
    `);
  });
});

describe('UpdateSchemaSpecificationAction', () => {
  test('add empty schema', () => {
    const emptySchemaState = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({ entityTypes: [], valueTypes: [] })
      )
    );
    expect(emptySchemaState).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [],
        "schema": AdminSchema {
          "spec": Object {
            "entityTypes": Array [],
            "valueTypes": Array [],
          },
        },
        "status": "",
        "valueTypes": Array [],
      }
    `);
  });

  test('one entity type', () => {
    const schemaState = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [
            {
              name: 'TitleOnly',
              adminOnly: false,
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
          valueTypes: [],
        })
      )
    );
    expect(schemaState).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [
              Object {
                "list": false,
                "name": "title",
                "status": "",
                "type": "String",
              },
            ],
            "name": "TitleOnly",
            "status": "",
            "type": "entity",
          },
        ],
        "schema": AdminSchema {
          "spec": Object {
            "entityTypes": Array [
              Object {
                "adminOnly": false,
                "fields": Array [
                  Object {
                    "name": "title",
                    "type": "String",
                  },
                ],
                "name": "TitleOnly",
              },
            ],
            "valueTypes": Array [],
          },
        },
        "status": "",
        "valueTypes": Array [],
      }
    `);
  });

  test('one value type', () => {
    const schemaState = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [],
          valueTypes: [
            {
              name: 'TitleOnly',
              adminOnly: false,
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        })
      )
    );
    expect(schemaState).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [],
        "schema": AdminSchema {
          "spec": Object {
            "entityTypes": Array [],
            "valueTypes": Array [
              Object {
                "adminOnly": false,
                "fields": Array [
                  Object {
                    "name": "title",
                    "type": "String",
                  },
                ],
                "name": "TitleOnly",
              },
            ],
          },
        },
        "status": "",
        "valueTypes": Array [
          Object {
            "fields": Array [
              Object {
                "list": false,
                "name": "title",
                "status": "",
                "type": "String",
              },
            ],
            "name": "TitleOnly",
            "status": "",
            "type": "value",
          },
        ],
      }
    `);
  });
});

describe('SchemaEditorReducer scenarios', () => {
  test('add type, save, force update', () => {
    const initialSchema = new AdminSchema({ entityTypes: [], valueTypes: [] });
    const beforeSaveState = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(initialSchema),
      new SchemaEditorActions.AddEntityType('NewType')
    );

    const newAdminSchema = new AdminSchema(
      initialSchema
        .mergeWith(getSchemaSpecificationUpdateFromEditorState(beforeSaveState))
        .valueOrThrow()
    );

    const afterSaveState = reduceSchemaEditorState(
      beforeSaveState,
      new SchemaEditorActions.UpdateSchemaSpecification(newAdminSchema, { force: true })
    );

    expect(afterSaveState).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [],
            "name": "NewType",
            "status": "",
            "type": "entity",
          },
        ],
        "schema": AdminSchema {
          "spec": Object {
            "entityTypes": Array [
              Object {
                "adminOnly": false,
                "fields": Array [],
                "name": "NewType",
              },
            ],
            "valueTypes": Array [],
          },
        },
        "status": "",
        "valueTypes": Array [],
      }
    `);
  });
});
