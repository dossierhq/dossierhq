import { AdminSchema, FieldType } from '@jonasb/datadata-core';
import {
  initializeSchemaEditorState,
  reduceSchemaEditorState,
  SchemaEditorActions,
} from './SchemaEditorReducer';

describe('initializeSchemaEditorState', () => {
  test('no args', () => {
    expect(initializeSchemaEditorState()).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [],
        "schema": null,
      }
    `);
  });
});

describe('UpdateSchemaSpecificationAction', () => {
  test('add empty schema', () => {
    const initialState = initializeSchemaEditorState();
    const emptySchemaState = reduceSchemaEditorState(
      initialState,
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
      }
    `);
  });

  test('one entity type', () => {
    const initialState = initializeSchemaEditorState();
    const emptySchemaState = reduceSchemaEditorState(
      initialState,
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
    expect(emptySchemaState).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "name": "TitleOnly",
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
      }
    `);
  });
});
