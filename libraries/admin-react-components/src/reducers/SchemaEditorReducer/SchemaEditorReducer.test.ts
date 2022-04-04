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
    const state = initializeSchemaEditorState();
    expect(state).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [],
        "schema": null,
        "status": "uninitialized",
        "valueTypes": Array [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`Object {}`);
  });
});

describe('AddEntityTypeAction', () => {
  test('add type to empty schema', () => {
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

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [],
            "name": "Foo",
          },
        ],
      }
    `);
  });

  test('add type with existing type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.AddEntityType('Bar')
    );

    expect(state).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [],
            "name": "Bar",
            "status": "new",
            "type": "entity",
          },
          Object {
            "fields": Array [],
            "name": "Foo",
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
                "name": "Foo",
              },
            ],
            "valueTypes": Array [],
          },
        },
        "status": "changed",
        "valueTypes": Array [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [],
            "name": "Bar",
          },
        ],
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

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [],
            "name": "Anaconda",
          },
          Object {
            "fields": Array [],
            "name": "ZooKeeper",
          },
        ],
      }
    `);
  });
});

describe('AddEntityTypeFieldAction', () => {
  test('add field to existing type (without any fields)', () => {
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
        "status": "changed",
        "valueTypes": Array [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [
              Object {
                "name": "bar",
                "type": "String",
              },
            ],
            "name": "Foo",
          },
        ],
      }
    `);
  });

  test('add field to existing type (with existing fields)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [
            { name: 'Foo', adminOnly: false, fields: [{ name: 'title', type: FieldType.String }] },
          ],
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
                "name": "title",
                "status": "",
                "type": "String",
              },
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
                "fields": Array [
                  Object {
                    "name": "title",
                    "type": "String",
                  },
                ],
                "name": "Foo",
              },
            ],
            "valueTypes": Array [],
          },
        },
        "status": "changed",
        "valueTypes": Array [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [
              Object {
                "name": "title",
                "type": "String",
              },
              Object {
                "name": "bar",
                "type": "String",
              },
            ],
            "name": "Foo",
          },
        ],
      }
    `);
  });
});

describe('UpdateSchemaSpecificationAction', () => {
  test('add empty schema', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({ entityTypes: [], valueTypes: [] })
      )
    );
    expect(state).toMatchInlineSnapshot(`
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

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`Object {}`);
  });

  test('one entity type', () => {
    const state = reduceSchemaEditorState(
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

    expect(state).toMatchInlineSnapshot(`
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

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`Object {}`);
  });

  test('one value type', () => {
    const state = reduceSchemaEditorState(
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

    expect(state).toMatchInlineSnapshot(`
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

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`Object {}`);
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
