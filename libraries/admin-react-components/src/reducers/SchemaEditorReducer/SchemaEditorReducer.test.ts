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

describe('AddTypeAction', () => {
  test('add entity type to empty schema', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({ entityTypes: [], valueTypes: [] })
      ),
      new SchemaEditorActions.AddType('entity', 'Foo')
    );

    expect(state).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [],
            "kind": "entity",
            "name": "Foo",
            "status": "new",
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

  test('add value type to empty schema', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({ entityTypes: [], valueTypes: [] })
      ),
      new SchemaEditorActions.AddType('value', 'Foo')
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
        "status": "changed",
        "valueTypes": Array [
          Object {
            "fields": Array [],
            "kind": "value",
            "name": "Foo",
            "status": "new",
          },
        ],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      Object {
        "valueTypes": Array [
          Object {
            "fields": Array [],
            "name": "Foo",
          },
        ],
      }
    `);
  });

  test('add entity type to schema with existing type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.AddType('entity', 'Bar')
    );

    expect(state).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [],
            "kind": "entity",
            "name": "Bar",
            "status": "new",
          },
          Object {
            "fields": Array [],
            "kind": "entity",
            "name": "Foo",
            "status": "",
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

  test('add value type to schema with existing type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [],
          valueTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
        })
      ),
      new SchemaEditorActions.AddType('value', 'Bar')
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
                "fields": Array [],
                "name": "Foo",
              },
            ],
          },
        },
        "status": "changed",
        "valueTypes": Array [
          Object {
            "fields": Array [],
            "kind": "value",
            "name": "Bar",
            "status": "new",
          },
          Object {
            "fields": Array [],
            "kind": "value",
            "name": "Foo",
            "status": "",
          },
        ],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      Object {
        "valueTypes": Array [
          Object {
            "fields": Array [],
            "name": "Bar",
          },
        ],
      }
    `);
  });

  test('add two entity types (orders)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({ entityTypes: [], valueTypes: [] })
      ),
      new SchemaEditorActions.AddType('entity', 'ZooKeeper'),
      new SchemaEditorActions.AddType('entity', 'Anaconda')
    );

    expect(state).toMatchInlineSnapshot(`
      Object {
        "entityTypes": Array [
          Object {
            "fields": Array [],
            "kind": "entity",
            "name": "Anaconda",
            "status": "new",
          },
          Object {
            "fields": Array [],
            "kind": "entity",
            "name": "ZooKeeper",
            "status": "new",
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

  test('add two value types (orders)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({ entityTypes: [], valueTypes: [] })
      ),
      new SchemaEditorActions.AddType('value', 'ZooKeeper'),
      new SchemaEditorActions.AddType('value', 'Anaconda')
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
        "status": "changed",
        "valueTypes": Array [
          Object {
            "fields": Array [],
            "kind": "value",
            "name": "Anaconda",
            "status": "new",
          },
          Object {
            "fields": Array [],
            "kind": "value",
            "name": "ZooKeeper",
            "status": "new",
          },
        ],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      Object {
        "valueTypes": Array [
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

describe('AddTypeFieldAction', () => {
  test('add field to existing entity type (without any fields)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.AddTypeField('entity', 'Foo', 'bar')
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
            "kind": "entity",
            "name": "Foo",
            "status": "changed",
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

  test('add field to existing value type (without any fields)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [],
          valueTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
        })
      ),
      new SchemaEditorActions.AddTypeField('value', 'Foo', 'bar')
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
                "fields": Array [],
                "name": "Foo",
              },
            ],
          },
        },
        "status": "changed",
        "valueTypes": Array [
          Object {
            "fields": Array [
              Object {
                "list": false,
                "name": "bar",
                "status": "new",
                "type": "String",
              },
            ],
            "kind": "value",
            "name": "Foo",
            "status": "changed",
          },
        ],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      Object {
        "valueTypes": Array [
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

  test('add field to existing entity type (with existing fields)', () => {
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
      new SchemaEditorActions.AddTypeField('entity', 'Foo', 'bar')
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
            "kind": "entity",
            "name": "Foo",
            "status": "changed",
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

  test('add field to existing value type (with existing fields)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [],
          valueTypes: [
            { name: 'Foo', adminOnly: false, fields: [{ name: 'title', type: FieldType.String }] },
          ],
        })
      ),
      new SchemaEditorActions.AddTypeField('value', 'Foo', 'bar')
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
                "name": "Foo",
              },
            ],
          },
        },
        "status": "changed",
        "valueTypes": Array [
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
            "kind": "value",
            "name": "Foo",
            "status": "changed",
          },
        ],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      Object {
        "valueTypes": Array [
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
            "kind": "entity",
            "name": "TitleOnly",
            "status": "",
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
            "kind": "value",
            "name": "TitleOnly",
            "status": "",
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
      new SchemaEditorActions.AddType('entity', 'NewType')
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
            "kind": "entity",
            "name": "NewType",
            "status": "",
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
