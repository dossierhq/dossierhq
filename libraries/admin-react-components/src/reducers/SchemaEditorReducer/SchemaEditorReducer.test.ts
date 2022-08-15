import { AdminSchema, FieldType, RichTextNodeType } from '@jonasb/datadata-core';
import { describe, expect, test } from 'vitest';
import {
  ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER,
  SchemaEditorState,
  SchemaEditorStateAction,
} from './SchemaEditorReducer';
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [],
        "schema": null,
        "schemaWillBeUpdatedDueToSave": false,
        "status": "uninitialized",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');
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
      {
        "activeSelector": {
          "kind": "entity",
          "typeName": "Foo",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [],
            "kind": "entity",
            "name": "Foo",
            "status": "new",
          },
        ],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [],
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
      {
        "activeSelector": {
          "kind": "value",
          "typeName": "Foo",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
        "entityTypes": [],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [],
            "kind": "value",
            "name": "Foo",
            "status": "new",
          },
        ],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [],
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
      {
        "activeSelector": {
          "kind": "entity",
          "typeName": "Bar",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [],
            "kind": "entity",
            "name": "Bar",
            "status": "new",
          },
          {
            "adminOnly": false,
            "fields": [],
            "kind": "entity",
            "name": "Foo",
            "status": "",
          },
        ],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "Foo",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [],
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
      {
        "activeSelector": {
          "kind": "value",
          "typeName": "Bar",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
        "entityTypes": [],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "Foo",
              },
            ],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [],
            "kind": "value",
            "name": "Bar",
            "status": "new",
          },
          {
            "adminOnly": false,
            "fields": [],
            "kind": "value",
            "name": "Foo",
            "status": "",
          },
        ],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [],
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
      {
        "activeSelector": {
          "kind": "entity",
          "typeName": "Anaconda",
        },
        "activeSelectorEditorScrollSignal": 2,
        "activeSelectorMenuScrollSignal": 2,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [],
            "kind": "entity",
            "name": "Anaconda",
            "status": "new",
          },
          {
            "adminOnly": false,
            "fields": [],
            "kind": "entity",
            "name": "ZooKeeper",
            "status": "new",
          },
        ],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [],
            "name": "Anaconda",
          },
          {
            "adminOnly": false,
            "fields": [],
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
      {
        "activeSelector": {
          "kind": "value",
          "typeName": "Anaconda",
        },
        "activeSelectorEditorScrollSignal": 2,
        "activeSelectorMenuScrollSignal": 2,
        "entityTypes": [],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [],
            "kind": "value",
            "name": "Anaconda",
            "status": "new",
          },
          {
            "adminOnly": false,
            "fields": [],
            "kind": "value",
            "name": "ZooKeeper",
            "status": "new",
          },
        ],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [],
            "name": "Anaconda",
          },
          {
            "adminOnly": false,
            "fields": [],
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "multiline": false,
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
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "Foo",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "multiline": false,
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "Foo",
              },
            ],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "multiline": false,
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
      {
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "multiline": false,
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "multiline": false,
                "name": "title",
                "required": false,
                "status": "",
                "type": "String",
              },
              {
                "list": false,
                "multiline": false,
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
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [
                  {
                    "name": "title",
                    "type": "String",
                  },
                ],
                "name": "Foo",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "multiline": false,
                "name": "title",
                "required": false,
                "type": "String",
              },
              {
                "multiline": false,
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [
              {
                "adminOnly": false,
                "fields": [
                  {
                    "name": "title",
                    "type": "String",
                  },
                ],
                "name": "Foo",
              },
            ],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "multiline": false,
                "name": "title",
                "required": false,
                "status": "",
                "type": "String",
              },
              {
                "list": false,
                "multiline": false,
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
      {
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "multiline": false,
                "name": "title",
                "required": false,
                "type": "String",
              },
              {
                "multiline": false,
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "entityTypes": [
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
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "Foo",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "entityTypes": [
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

describe('ChangeFieldAllowedRichTextNodesAction', () => {
  test('change node types (add entity) of a new rich text field', () => {
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
        FieldType.RichText,
        false
      ),
      new SchemaEditorActions.ChangeFieldAllowedRichTextNodes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        [RichTextNodeType.entity]
      )
    );
    expect(state.entityTypes[0].fields[0].richTextNodes).toEqual([
      ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER,
      RichTextNodeType.entity,
    ]);
    expect(state).toMatchInlineSnapshot(`
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "name": "foo",
                "required": false,
                "richTextNodes": [
                  "root, paragraph, text",
                  "entity",
                ],
                "status": "new",
                "type": "RichText",
              },
            ],
            "kind": "entity",
            "name": "Foo",
            "status": "changed",
          },
        ],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "Foo",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "name": "foo",
                "required": false,
                "richTextNodes": [
                  "root",
                  "paragraph",
                  "text",
                  "entity",
                ],
                "type": "RichText",
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "Foo",
              },
            ],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "name": "foo",
                "required": false,
                "status": "new",
                "type": "ValueType",
                "valueTypes": [
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
      {
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "name": "foo",
                "required": false,
                "type": "ValueType",
                "valueType": [
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

describe('ChangeFieldMultilineAction', () => {
  test('make new multiline field in existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
          valueTypes: [],
        })
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldMultiline(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        true
      )
    );
    expect(state).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].multiline).toBe(true);
    expect(schemaUpdate?.entityTypes?.[0].fields[0].multiline).toBe(true);
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "multiline": false,
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
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "Foo",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "multiline": false,
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
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
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "Foo",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "Foo",
              },
            ],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
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
      {
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "entityTypes": [],
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
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "Foo",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "entityTypes": [],
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "name": "bar",
                "required": false,
                "status": "new",
                "type": "ValueType",
                "valueTypes": [],
              },
            ],
            "kind": "entity",
            "name": "Foo",
            "status": "changed",
          },
        ],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "Foo",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "name": "bar",
                "required": false,
                "type": "ValueType",
                "valueType": [],
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
      {
        "activeSelector": {
          "kind": "entity",
          "typeName": "Foo",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
        "entityTypes": [
          {
            "adminOnly": true,
            "fields": [],
            "kind": "entity",
            "name": "Foo",
            "status": "new",
          },
        ],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "entityTypes": [
          {
            "adminOnly": true,
            "fields": [],
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "multiline": false,
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
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [
                  {
                    "name": "title",
                    "type": "String",
                  },
                ],
                "name": "Foo",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
        "entityTypes": [],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');

    expect(state.status).toBe(''); // should be reset
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
        "entityTypes": [],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');
    expect(state.status).toBe(''); // should be reset
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "multiline": false,
                "name": "title",
                "required": false,
                "status": "",
                "type": "String",
              },
              {
                "list": false,
                "multiline": false,
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
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [
                  {
                    "name": "title",
                    "type": "String",
                  },
                ],
                "name": "Foo",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "multiline": false,
                "name": "title",
                "required": false,
                "type": "String",
              },
              {
                "multiline": false,
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
      {
        "activeSelector": {
          "kind": "entity",
          "typeName": "Bar",
        },
        "activeSelectorEditorScrollSignal": 2,
        "activeSelectorMenuScrollSignal": 2,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [],
            "kind": "entity",
            "name": "Bar",
            "status": "new",
          },
        ],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "changed",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot(`
      {
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [],
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
      {
        "activeSelector": {
          "kind": "entity",
          "typeName": "Foo",
        },
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [],
            "kind": "entity",
            "name": "Foo",
            "status": "",
          },
        ],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "Foo",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');
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
      {
        "activeSelector": {
          "kind": "entity",
          "typeName": "Foo",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [],
            "kind": "entity",
            "name": "Foo",
            "status": "",
          },
        ],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "Foo",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "multiline": false,
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
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [
                  {
                    "name": "title",
                    "type": "String",
                  },
                ],
                "name": "TitleOnly",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');
  });

  test('one entity type with rich text field', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        new AdminSchema({
          entityTypes: [
            {
              name: 'TitleOnly',
              adminOnly: false,
              fields: [
                {
                  name: 'richText',
                  type: FieldType.RichText,
                  richTextNodes: [
                    RichTextNodeType.root,
                    RichTextNodeType.paragraph,
                    RichTextNodeType.text,
                    RichTextNodeType.entity,
                  ],
                },
              ],
            },
          ],
          valueTypes: [],
        })
      )
    );

    expect(state.entityTypes[0].fields[0].richTextNodes).toEqual([
      ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER,
      RichTextNodeType.entity,
    ]);

    expect(state).toMatchInlineSnapshot(`
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "name": "richText",
                "required": false,
                "richTextNodes": [
                  "root, paragraph, text",
                  "entity",
                ],
                "status": "",
                "type": "RichText",
              },
            ],
            "kind": "entity",
            "name": "TitleOnly",
            "status": "",
          },
        ],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [
                  {
                    "name": "richText",
                    "richTextNodes": [
                      "root",
                      "paragraph",
                      "text",
                      "entity",
                    ],
                    "type": "RichText",
                  },
                ],
                "name": "TitleOnly",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "",
        "valueTypes": [],
      }
    `);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [],
            "valueTypes": [
              {
                "adminOnly": false,
                "fields": [
                  {
                    "name": "title",
                    "type": "String",
                  },
                ],
                "name": "TitleOnly",
              },
            ],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "",
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "multiline": false,
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

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "entityTypes": [
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
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [
                  {
                    "entityTypes": [
                      "Foo",
                    ],
                    "name": "reference",
                    "type": "EntityType",
                  },
                ],
                "name": "EntityReference",
              },
            ],
            "valueTypes": [
              {
                "adminOnly": false,
                "fields": [
                  {
                    "entityTypes": [
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
        "schemaWillBeUpdatedDueToSave": false,
        "status": "",
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "entityTypes": [
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

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');
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
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "name": "valueItem",
                "required": false,
                "status": "",
                "type": "ValueType",
                "valueTypes": [
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
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [
                  {
                    "name": "valueItem",
                    "type": "ValueType",
                    "valueTypes": [
                      "ValueItem",
                    ],
                  },
                ],
                "name": "EntityWithValueItem",
              },
            ],
            "valueTypes": [
              {
                "adminOnly": false,
                "fields": [
                  {
                    "name": "valueItem",
                    "type": "ValueType",
                    "valueTypes": [
                      "ValueItem",
                    ],
                  },
                ],
                "name": "ValueItem",
              },
            ],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "",
        "valueTypes": [
          {
            "adminOnly": false,
            "fields": [
              {
                "list": false,
                "name": "valueItem",
                "required": false,
                "status": "",
                "type": "ValueType",
                "valueTypes": [
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

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');
  });
});

describe('SchemaEditorReducer scenarios', () => {
  test('add type, save, force update', () => {
    const initialSchema = new AdminSchema({ entityTypes: [], valueTypes: [] });
    const beforeSaveState = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(initialSchema),
      new SchemaEditorActions.AddType('entity', 'NewType'),
      new SchemaEditorActions.SetNextUpdateSchemaSpecificationIsDueToSave(true)
    );

    const newAdminSchema = new AdminSchema(
      initialSchema
        .mergeWith(getSchemaSpecificationUpdateFromEditorState(beforeSaveState))
        .valueOrThrow()
    );

    const afterSaveState = reduceSchemaEditorState(
      beforeSaveState,
      new SchemaEditorActions.UpdateSchemaSpecification(newAdminSchema)
    );

    expect(afterSaveState).toMatchInlineSnapshot(`
      {
        "activeSelector": {
          "kind": "entity",
          "typeName": "NewType",
        },
        "activeSelectorEditorScrollSignal": 1,
        "activeSelectorMenuScrollSignal": 1,
        "entityTypes": [
          {
            "adminOnly": false,
            "fields": [],
            "kind": "entity",
            "name": "NewType",
            "status": "",
          },
        ],
        "schema": AdminSchema {
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "fields": [],
                "name": "NewType",
              },
            ],
            "valueTypes": [],
          },
        },
        "schemaWillBeUpdatedDueToSave": false,
        "status": "",
        "valueTypes": [],
      }
    `);
  });
});
