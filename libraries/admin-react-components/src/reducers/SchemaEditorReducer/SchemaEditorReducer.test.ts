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
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
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
        "activeSelector": Object {
          "kind": "entity",
          "typeName": "Foo",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
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
            "adminOnly": false,
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
        "activeSelector": Object {
          "kind": "value",
          "typeName": "Foo",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
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
            "adminOnly": false,
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
            "adminOnly": false,
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
        "activeSelector": Object {
          "kind": "entity",
          "typeName": "Bar",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [],
            "kind": "entity",
            "name": "Bar",
            "status": "new",
          },
          Object {
            "adminOnly": false,
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
            "adminOnly": false,
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
        "activeSelector": Object {
          "kind": "value",
          "typeName": "Bar",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
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
            "adminOnly": false,
            "fields": Array [],
            "kind": "value",
            "name": "Bar",
            "status": "new",
          },
          Object {
            "adminOnly": false,
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
            "adminOnly": false,
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
        "activeSelector": Object {
          "kind": "entity",
          "typeName": "Anaconda",
        },
        "activeSelectorEditorScrollSignal": 2,
        "activeSelectorMenuScrollSignal": 2,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [],
            "kind": "entity",
            "name": "Anaconda",
            "status": "new",
          },
          Object {
            "adminOnly": false,
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
            "adminOnly": false,
            "fields": Array [],
            "name": "Anaconda",
          },
          Object {
            "adminOnly": false,
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
        "activeSelector": Object {
          "kind": "value",
          "typeName": "Anaconda",
        },
        "activeSelectorEditorScrollSignal": 2,
        "activeSelectorMenuScrollSignal": 2,
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
            "adminOnly": false,
            "fields": Array [],
            "kind": "value",
            "name": "Anaconda",
            "status": "new",
          },
          Object {
            "adminOnly": false,
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
            "adminOnly": false,
            "fields": Array [],
            "name": "Anaconda",
          },
          Object {
            "adminOnly": false,
            "fields": Array [],
            "name": "ZooKeeper",
          },
        ],
      }
    `);
  });
});

describe('AddFieldAction', () => {
  test('add field to existing entity type (without any fields)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar')
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": false,
                "name": "bar",
                "required": false,
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "name": "bar",
                "required": false,
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
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'bar')
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": false,
                "name": "bar",
                "required": false,
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "name": "bar",
                "required": false,
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
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar')
    );

    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": false,
                "name": "title",
                "required": false,
                "status": "",
                "type": "String",
              },
              Object {
                "list": false,
                "name": "bar",
                "required": false,
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "name": "title",
                "required": false,
                "type": "String",
              },
              Object {
                "name": "bar",
                "required": false,
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
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'bar')
    );

    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": false,
                "name": "title",
                "required": false,
                "status": "",
                "type": "String",
              },
              Object {
                "list": false,
                "name": "bar",
                "required": false,
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "name": "title",
                "required": false,
                "type": "String",
              },
              Object {
                "name": "bar",
                "required": false,
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

describe('ChangeFieldAllowedEntityTypesAction', () => {
  test('change entity types of a new entity field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'foo'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        FieldType.EntityType,
        false
      ),
      new SchemaEditorActions.ChangeFieldAllowedEntityTypes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        ['Foo']
      )
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [
              Object {
                "entityTypes": Array [
                  "Foo",
                ],
                "list": false,
                "name": "foo",
                "required": false,
                "status": "new",
                "type": "EntityType",
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "entityTypes": Array [
                  "Foo",
                ],
                "name": "foo",
                "required": false,
                "type": "EntityType",
              },
            ],
            "name": "Foo",
          },
        ],
      }
    `);
  });
});

describe('ChangeFieldAllowedValueTypesAction', () => {
  test('change entity types of a new entity field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [],
          valueTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
        })
      ),
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'foo'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'value', typeName: 'Foo', fieldName: 'foo' },
        FieldType.ValueType,
        false
      ),
      new SchemaEditorActions.ChangeFieldAllowedValueTypes(
        { kind: 'value', typeName: 'Foo', fieldName: 'foo' },
        ['Foo']
      )
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": false,
                "name": "foo",
                "required": false,
                "status": "new",
                "type": "ValueType",
                "valueTypes": Array [
                  "Foo",
                ],
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "name": "foo",
                "required": false,
                "type": "ValueType",
                "valueType": Array [
                  "Foo",
                ],
              },
            ],
            "name": "Foo",
          },
        ],
      }
    `);
  });
});

describe('ChangeFieldRequiredAction', () => {
  test('make new field required in existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldRequired(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        true
      )
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": false,
                "name": "bar",
                "required": true,
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "name": "bar",
                "required": true,
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

describe('ChangeFieldTypeAction', () => {
  test('from string to location list (new field of existing entity type)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        FieldType.Location,
        true
      )
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": true,
                "name": "bar",
                "required": false,
                "status": "new",
                "type": "Location",
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": true,
                "name": "bar",
                "required": false,
                "type": "Location",
              },
            ],
            "name": "Foo",
          },
        ],
      }
    `);
  });

  test('from string to location list (new field of existing value type)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [],
          valueTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
        })
      ),
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'value', typeName: 'Foo', fieldName: 'bar' },
        FieldType.Location,
        true
      )
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": true,
                "name": "bar",
                "required": false,
                "status": "new",
                "type": "Location",
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": true,
                "name": "bar",
                "required": false,
                "type": "Location",
              },
            ],
            "name": "Foo",
          },
        ],
      }
    `);
  });

  test('from string to entity (new field of existing entity type)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        FieldType.EntityType,
        false
      )
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [
              Object {
                "entityTypes": Array [],
                "list": false,
                "name": "bar",
                "required": false,
                "status": "new",
                "type": "EntityType",
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "entityTypes": Array [],
                "name": "bar",
                "required": false,
                "type": "EntityType",
              },
            ],
            "name": "Foo",
          },
        ],
      }
    `);
  });

  test('from string to value (new field of existing entity type)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        FieldType.ValueType,
        false
      )
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": false,
                "name": "bar",
                "required": false,
                "status": "new",
                "type": "ValueType",
                "valueTypes": Array [],
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "name": "bar",
                "required": false,
                "type": "ValueType",
                "valueType": Array [],
              },
            ],
            "name": "Foo",
          },
        ],
      }
    `);
  });
});

describe('ChangeTypeAdminOnlyAction', () => {
  test('make new entity type admin only', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.AddType('entity', 'Foo'),
      new SchemaEditorActions.ChangeTypeAdminOnly({ kind: 'entity', typeName: 'Foo' }, true)
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": Object {
          "kind": "entity",
          "typeName": "Foo",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
        "entityTypes": Array [
          Object {
            "adminOnly": true,
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
            "adminOnly": true,
            "fields": Array [],
            "name": "Foo",
          },
        ],
      }
    `);
  });
});

describe('DeleteFieldAction', () => {
  test('add and delete field', () => {
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
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.DeleteField({ kind: 'entity', typeName: 'Foo', fieldName: 'bar' })
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": false,
                "name": "title",
                "required": false,
                "status": "",
                "type": "String",
              },
            ],
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
        "status": "",
        "valueTypes": Array [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`Object {}`);
  });
});

describe('DeleteTypeAction', () => {
  test('delete newly added entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({ entityTypes: [], valueTypes: [] })
      ),
      new SchemaEditorActions.AddType('entity', 'Foo'),
      new SchemaEditorActions.DeleteType({ kind: 'entity', typeName: 'Foo' })
    );

    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": Object {
          "kind": "entity",
          "typeName": "Foo",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
        "entityTypes": Array [],
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

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`Object {}`);
  });

  test('delete newly added value type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({ entityTypes: [], valueTypes: [] })
      ),
      new SchemaEditorActions.AddType('value', 'Foo'),
      new SchemaEditorActions.DeleteType({ kind: 'value', typeName: 'Foo' })
    );

    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": Object {
          "kind": "value",
          "typeName": "Foo",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
        "entityTypes": Array [],
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

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`Object {}`);
  });
});

describe('RenameFieldAction', () => {
  test('add and rename field', () => {
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
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.RenameField(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        'baz'
      )
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": false,
                "name": "title",
                "required": false,
                "status": "",
                "type": "String",
              },
              Object {
                "list": false,
                "name": "baz",
                "required": false,
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "name": "title",
                "required": false,
                "type": "String",
              },
              Object {
                "name": "baz",
                "required": false,
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

describe('RenameTypeAction', () => {
  test('add and rename type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.AddType('entity', 'Foo'),
      new SchemaEditorActions.RenameType({ kind: 'entity', typeName: 'Foo' }, 'Bar')
    );

    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": Object {
          "kind": "entity",
          "typeName": "Bar",
        },
        "activeSelectorEditorScrollSignal": 2,
        "activeSelectorMenuScrollSignal": 2,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [],
            "kind": "entity",
            "name": "Bar",
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
            "adminOnly": false,
            "fields": Array [],
            "name": "Bar",
          },
        ],
      }
    `);
  });
});

describe('SetActiveSelectorAction', () => {
  test('set to type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.SetActiveSelector({ kind: 'entity', typeName: 'Foo' }, false, false)
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": Object {
          "kind": "entity",
          "typeName": "Foo",
        },
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
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
        "status": "",
        "valueTypes": Array [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`Object {}`);
  });

  test('set to type with editor scroll', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.SetActiveSelector({ kind: 'entity', typeName: 'Foo' }, false, true)
    );
    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": Object {
          "kind": "entity",
          "typeName": "Foo",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
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
        "status": "",
        "valueTypes": Array [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`Object {}`);
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
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
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
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": false,
                "name": "title",
                "required": false,
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
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
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
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": false,
                "name": "title",
                "required": false,
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

  test('entity type field', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [
            {
              name: 'EntityReference',
              adminOnly: false,
              fields: [{ name: 'reference', type: FieldType.EntityType, entityTypes: ['Foo'] }],
            },
          ],
          valueTypes: [
            {
              name: 'ValueReference',
              adminOnly: false,
              fields: [{ name: 'reference', type: FieldType.EntityType, entityTypes: ['Foo'] }],
            },
          ],
        })
      )
    );

    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [
              Object {
                "entityTypes": Array [
                  "Foo",
                ],
                "list": false,
                "name": "reference",
                "required": false,
                "status": "",
                "type": "EntityType",
              },
            ],
            "kind": "entity",
            "name": "EntityReference",
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
                    "entityTypes": Array [
                      "Foo",
                    ],
                    "name": "reference",
                    "type": "EntityType",
                  },
                ],
                "name": "EntityReference",
              },
            ],
            "valueTypes": Array [
              Object {
                "adminOnly": false,
                "fields": Array [
                  Object {
                    "entityTypes": Array [
                      "Foo",
                    ],
                    "name": "reference",
                    "type": "EntityType",
                  },
                ],
                "name": "ValueReference",
              },
            ],
          },
        },
        "status": "",
        "valueTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [
              Object {
                "entityTypes": Array [
                  "Foo",
                ],
                "list": false,
                "name": "reference",
                "required": false,
                "status": "",
                "type": "EntityType",
              },
            ],
            "kind": "value",
            "name": "ValueReference",
            "status": "",
          },
        ],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`Object {}`);
  });

  test('value type field', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [
            {
              name: 'EntityWithValueItem',
              adminOnly: false,
              fields: [{ name: 'valueItem', type: FieldType.ValueType, valueTypes: ['ValueItem'] }],
            },
          ],
          valueTypes: [
            {
              name: 'ValueItem',
              adminOnly: false,
              fields: [{ name: 'valueItem', type: FieldType.ValueType, valueTypes: ['ValueItem'] }],
            },
          ],
        })
      )
    );

    expect(state).toMatchInlineSnapshot(`
      Object {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": false,
                "name": "valueItem",
                "required": false,
                "status": "",
                "type": "ValueType",
                "valueTypes": Array [
                  "ValueItem",
                ],
              },
            ],
            "kind": "entity",
            "name": "EntityWithValueItem",
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
                    "name": "valueItem",
                    "type": "ValueType",
                    "valueTypes": Array [
                      "ValueItem",
                    ],
                  },
                ],
                "name": "EntityWithValueItem",
              },
            ],
            "valueTypes": Array [
              Object {
                "adminOnly": false,
                "fields": Array [
                  Object {
                    "name": "valueItem",
                    "type": "ValueType",
                    "valueTypes": Array [
                      "ValueItem",
                    ],
                  },
                ],
                "name": "ValueItem",
              },
            ],
          },
        },
        "status": "",
        "valueTypes": Array [
          Object {
            "adminOnly": false,
            "fields": Array [
              Object {
                "list": false,
                "name": "valueItem",
                "required": false,
                "status": "",
                "type": "ValueType",
                "valueTypes": Array [
                  "ValueItem",
                ],
              },
            ],
            "kind": "value",
            "name": "ValueItem",
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
        "activeSelector": Object {
          "kind": "entity",
          "typeName": "NewType",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
        "entityTypes": Array [
          Object {
            "adminOnly": false,
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
