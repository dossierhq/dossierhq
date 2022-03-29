import { AdminSchema, FieldType } from '@jonasb/datadata-core';
import type { SchemaEditorState, SchemaEditorStateAction } from './SchemaEditorReducer';
import {
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
        "valueTypes": Array [],
      }
    `);
  });
});

describe('AddEntityTypeAction', () => {
  test('add type', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.AddEntityType('Foo')
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [],
            "name": "Foo",
            "type": "entity",
          },
        ],
        "schema": null,
        "valueTypes": Array [],
      }
    `);
  });

  test('add two types (orders)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.AddEntityType('ZooKeeper'),
      new SchemaEditorActions.AddEntityType('Anaconda')
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [],
            "name": "Anaconda",
            "type": "entity",
          },
          Object {
            "fields": Array [],
            "name": "ZooKeeper",
            "type": "entity",
          },
        ],
        "schema": null,
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
                "type": "String",
              },
            ],
            "name": "TitleOnly",
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
        "valueTypes": Array [
          Object {
            "fields": Array [
              Object {
                "list": false,
                "name": "title",
                "type": "String",
              },
            ],
            "name": "TitleOnly",
            "type": "value",
          },
        ],
      }
    `);
  });
});
