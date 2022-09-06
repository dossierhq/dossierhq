import type { AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';
import { AdminSchema, assertIsDefined, FieldType, RichTextNodeType } from '@jonasb/datadata-core';
import { describe, expect, test } from 'vitest';
import type { SchemaEditorState, SchemaEditorStateAction } from './SchemaEditorReducer';
import {
  getSchemaSpecificationUpdateFromEditorState,
  initializeSchemaEditorState,
  reduceSchemaEditorState,
  ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER,
  SchemaEditorActions,
} from './SchemaEditorReducer';

function createAdminSchema(update: AdminSchemaSpecificationUpdate): AdminSchema {
  return new AdminSchema(
    new AdminSchema({ entityTypes: [], valueTypes: [], patterns: [] })
      .mergeWith(update)
      .valueOrThrow()
  );
}

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
      new SchemaEditorActions.UpdateSchemaSpecification(createAdminSchema({})),
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
            "patterns": [],
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
      new SchemaEditorActions.UpdateSchemaSpecification(createAdminSchema({})),
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
            "patterns": [],
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
        createAdminSchema({ entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
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
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "patterns": [],
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
        createAdminSchema({ valueTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
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
            "patterns": [],
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
      new SchemaEditorActions.UpdateSchemaSpecification(createAdminSchema({})),
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
            "patterns": [],
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
      new SchemaEditorActions.UpdateSchemaSpecification(createAdminSchema({})),
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
            "patterns": [],
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
        createAdminSchema({ entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
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
                "adminOnly": false,
                "existingFieldSpec": null,
                "isName": false,
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
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "patterns": [],
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
                "adminOnly": false,
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
        createAdminSchema({ valueTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
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
            "patterns": [],
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
                "adminOnly": false,
                "existingFieldSpec": null,
                "isName": false,
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
                "adminOnly": false,
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
        createAdminSchema({
          entityTypes: [
            { name: 'Foo', adminOnly: false, fields: [{ name: 'title', type: FieldType.String }] },
          ],
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
                "adminOnly": false,
                "existingFieldSpec": {
                  "name": "title",
                  "type": "String",
                },
                "isName": false,
                "list": false,
                "multiline": false,
                "name": "title",
                "required": false,
                "status": "",
                "type": "String",
              },
              {
                "adminOnly": false,
                "existingFieldSpec": null,
                "isName": false,
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
                "authKeyPattern": null,
                "fields": [
                  {
                    "name": "title",
                    "type": "String",
                  },
                ],
                "name": "Foo",
              },
            ],
            "patterns": [],
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
                "adminOnly": false,
                "multiline": false,
                "name": "title",
                "required": false,
                "type": "String",
              },
              {
                "adminOnly": false,
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
        createAdminSchema({
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
            "patterns": [],
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
                "adminOnly": false,
                "existingFieldSpec": {
                  "name": "title",
                  "type": "String",
                },
                "isName": false,
                "list": false,
                "multiline": false,
                "name": "title",
                "required": false,
                "status": "",
                "type": "String",
              },
              {
                "adminOnly": false,
                "existingFieldSpec": null,
                "isName": false,
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
                "adminOnly": false,
                "multiline": false,
                "name": "title",
                "required": false,
                "type": "String",
              },
              {
                "adminOnly": false,
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

describe('ChangeFieldAdminOnlyAction', () => {
  test('make new field admin only in existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        createAdminSchema({ entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldAdminOnly(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        true
      )
    );
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('ChangeFieldAllowedEntityTypesAction', () => {
  test('change entity types of a new entity field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        createAdminSchema({ entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
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
                "adminOnly": false,
                "entityTypes": [
                  "Foo",
                ],
                "existingFieldSpec": null,
                "isName": false,
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
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "patterns": [],
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
                "adminOnly": false,
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
        createAdminSchema({ entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
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
      ),
      new SchemaEditorActions.ChangeFieldAllowedEntityTypes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        ['Foo']
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
                "adminOnly": false,
                "entityTypes": [
                  "Foo",
                ],
                "existingFieldSpec": null,
                "isName": false,
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
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "patterns": [],
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
                "adminOnly": false,
                "entityTypes": [
                  "Foo",
                ],
                "name": "foo",
                "required": false,
                "richTextNodes": [
                  "root",
                  "paragraph",
                  "text",
                  "entity",
                ],
                "type": "RichText",
                "valueTypes": [],
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
        createAdminSchema({ valueTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
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
            "patterns": [],
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
                "adminOnly": false,
                "existingFieldSpec": null,
                "isName": false,
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
                "adminOnly": false,
                "name": "foo",
                "required": false,
                "type": "ValueType",
                "valueTypes": [
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

describe('ChangeFieldIsNameAction', () => {
  test('make new string field is-name in new type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(createAdminSchema({})),
      new SchemaEditorActions.AddType('entity', 'TitleOnly'),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'TitleOnly' }, 'title'),
      new SchemaEditorActions.ChangeFieldIsName(
        { kind: 'entity', typeName: 'TitleOnly', fieldName: 'title' },
        true
      )
    );
    expect(state).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].isName).toBe(true);
    expect(schemaUpdate?.entityTypes?.[0].fields[0].isName).toBe(true);
  });

  test('make other field is-name, and switch back', () => {
    let state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        createAdminSchema({
          entityTypes: [
            {
              name: 'TitleOnly',
              adminOnly: false,
              fields: [{ name: 'title', type: FieldType.String, isName: true }],
            },
          ],
        })
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'TitleOnly' }, 'other'),
      new SchemaEditorActions.ChangeFieldIsName(
        { kind: 'entity', typeName: 'TitleOnly', fieldName: 'other' },
        true
      )
    );
    expect(state).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    let titleFieldDraft = state.entityTypes[0].fields.find((it) => it.name === 'title');
    assertIsDefined(titleFieldDraft);
    let otherFieldDraft = state.entityTypes[0].fields.find((it) => it.name === 'other');
    assertIsDefined(otherFieldDraft);

    expect(titleFieldDraft.isName).toBe(false); // unchecked when other field is checked
    expect(otherFieldDraft.isName).toBe(true);
    expect(titleFieldDraft.status).toBe('changed');
    expect(otherFieldDraft.status).toBe('new');

    // Change back
    state = reduceSchemaEditorStateActions(
      state,
      new SchemaEditorActions.ChangeFieldIsName(
        { kind: 'entity', typeName: 'TitleOnly', fieldName: 'title' },
        true
      )
    );
    expect(state).toMatchSnapshot();

    titleFieldDraft = state.entityTypes[0].fields.find((it) => it.name === 'title');
    assertIsDefined(titleFieldDraft);
    otherFieldDraft = state.entityTypes[0].fields.find((it) => it.name === 'other');
    assertIsDefined(otherFieldDraft);

    expect(titleFieldDraft.isName).toBe(true);
    expect(otherFieldDraft.isName).toBe(false); // unchecked when title field is checked
    expect(titleFieldDraft.status).toBe('');
    expect(otherFieldDraft.status).toBe('new');
  });
});

describe('ChangeFieldMultilineAction', () => {
  test('make new multiline field in existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        createAdminSchema({ entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
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
        createAdminSchema({ entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
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
                "adminOnly": false,
                "existingFieldSpec": null,
                "isName": false,
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
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "patterns": [],
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
                "adminOnly": false,
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
        createAdminSchema({ entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
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
                "adminOnly": false,
                "existingFieldSpec": null,
                "isName": false,
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
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "patterns": [],
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
                "adminOnly": false,
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
        createAdminSchema({ valueTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
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
            "patterns": [],
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
                "adminOnly": false,
                "existingFieldSpec": null,
                "isName": false,
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
                "adminOnly": false,
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
        createAdminSchema({ entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
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
                "adminOnly": false,
                "entityTypes": [],
                "existingFieldSpec": null,
                "isName": false,
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
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "patterns": [],
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
                "adminOnly": false,
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
        createAdminSchema({ entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
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
                "adminOnly": false,
                "existingFieldSpec": null,
                "isName": false,
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
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "patterns": [],
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
                "adminOnly": false,
                "name": "bar",
                "required": false,
                "type": "ValueType",
                "valueTypes": [],
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
      new SchemaEditorActions.UpdateSchemaSpecification(createAdminSchema({})),
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
            "patterns": [],
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
        createAdminSchema({
          entityTypes: [
            { name: 'Foo', adminOnly: false, fields: [{ name: 'title', type: FieldType.String }] },
          ],
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
                "adminOnly": false,
                "existingFieldSpec": {
                  "name": "title",
                  "type": "String",
                },
                "isName": false,
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
                "authKeyPattern": null,
                "fields": [
                  {
                    "name": "title",
                    "type": "String",
                  },
                ],
                "name": "Foo",
              },
            ],
            "patterns": [],
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
      new SchemaEditorActions.UpdateSchemaSpecification(createAdminSchema({})),
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
            "patterns": [],
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
      new SchemaEditorActions.UpdateSchemaSpecification(createAdminSchema({})),
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
            "patterns": [],
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
        createAdminSchema({
          entityTypes: [
            { name: 'Foo', adminOnly: false, fields: [{ name: 'title', type: FieldType.String }] },
          ],
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
                "adminOnly": false,
                "existingFieldSpec": {
                  "name": "title",
                  "type": "String",
                },
                "isName": false,
                "list": false,
                "multiline": false,
                "name": "title",
                "required": false,
                "status": "",
                "type": "String",
              },
              {
                "adminOnly": false,
                "existingFieldSpec": null,
                "isName": false,
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
                "authKeyPattern": null,
                "fields": [
                  {
                    "name": "title",
                    "type": "String",
                  },
                ],
                "name": "Foo",
              },
            ],
            "patterns": [],
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
                "adminOnly": false,
                "multiline": false,
                "name": "title",
                "required": false,
                "type": "String",
              },
              {
                "adminOnly": false,
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
      new SchemaEditorActions.UpdateSchemaSpecification(createAdminSchema({})),
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
            "patterns": [],
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

  test('add and rename entity type with fields referring to itself', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(createAdminSchema({})),
      new SchemaEditorActions.AddType('entity', 'Foo'),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'self'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'self' },
        FieldType.EntityType,
        false
      ),
      new SchemaEditorActions.ChangeFieldAllowedEntityTypes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'self' },
        ['Foo']
      ),
      new SchemaEditorActions.RenameType({ kind: 'entity', typeName: 'Foo' }, 'Bar')
    );

    expect(state).toMatchSnapshot();
    expect(state.entityTypes[0].name).toBe('Bar');
    expect(state.entityTypes[0].fields[0].entityTypes).toEqual(['Bar']);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add and rename value type with fields referring to itself', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(createAdminSchema({})),
      new SchemaEditorActions.AddType('value', 'Foo'),
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'self'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'value', typeName: 'Foo', fieldName: 'self' },
        FieldType.ValueType,
        false
      ),
      new SchemaEditorActions.ChangeFieldAllowedValueTypes(
        { kind: 'value', typeName: 'Foo', fieldName: 'self' },
        ['Foo']
      ),
      new SchemaEditorActions.RenameType({ kind: 'value', typeName: 'Foo' }, 'Bar')
    );

    expect(state).toMatchSnapshot();
    expect(state.valueTypes[0].name).toBe('Bar');
    expect(state.valueTypes[0].fields[0].valueTypes).toEqual(['Bar']);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('SetActiveSelectorAction', () => {
  test('set to type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        createAdminSchema({ entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }] })
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
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "patterns": [],
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
        createAdminSchema({
          entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
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
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "patterns": [],
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
      new SchemaEditorActions.UpdateSchemaSpecification(createAdminSchema({}))
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
            "patterns": [],
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
        createAdminSchema({
          entityTypes: [
            {
              name: 'TitleOnly',
              adminOnly: false,
              fields: [{ name: 'title', type: FieldType.String, isName: true }],
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
                "adminOnly": false,
                "existingFieldSpec": {
                  "isName": true,
                  "name": "title",
                  "type": "String",
                },
                "isName": true,
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
                "authKeyPattern": null,
                "fields": [
                  {
                    "isName": true,
                    "name": "title",
                    "type": "String",
                  },
                ],
                "name": "TitleOnly",
              },
            ],
            "patterns": [],
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
        createAdminSchema({
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
                "adminOnly": false,
                "entityTypes": [],
                "existingFieldSpec": {
                  "name": "richText",
                  "richTextNodes": [
                    "root",
                    "paragraph",
                    "text",
                    "entity",
                  ],
                  "type": "RichText",
                },
                "isName": false,
                "list": false,
                "name": "richText",
                "required": false,
                "richTextNodes": [
                  "root, paragraph, text",
                  "entity",
                ],
                "status": "",
                "type": "RichText",
                "valueTypes": [],
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
                "authKeyPattern": null,
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
            "patterns": [],
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
        createAdminSchema({
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
            "patterns": [],
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
                "adminOnly": false,
                "existingFieldSpec": {
                  "name": "title",
                  "type": "String",
                },
                "isName": false,
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
        createAdminSchema({
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
                "adminOnly": false,
                "entityTypes": [
                  "Foo",
                ],
                "existingFieldSpec": {
                  "entityTypes": [
                    "Foo",
                  ],
                  "name": "reference",
                  "type": "EntityType",
                },
                "isName": false,
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
                "authKeyPattern": null,
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
            "patterns": [],
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
                "adminOnly": false,
                "entityTypes": [
                  "Foo",
                ],
                "existingFieldSpec": {
                  "entityTypes": [
                    "Foo",
                  ],
                  "name": "reference",
                  "type": "EntityType",
                },
                "isName": false,
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
        createAdminSchema({
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
                "adminOnly": false,
                "existingFieldSpec": {
                  "name": "valueItem",
                  "type": "ValueType",
                  "valueTypes": [
                    "ValueItem",
                  ],
                },
                "isName": false,
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
                "authKeyPattern": null,
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
            "patterns": [],
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
                "adminOnly": false,
                "existingFieldSpec": {
                  "name": "valueItem",
                  "type": "ValueType",
                  "valueTypes": [
                    "ValueItem",
                  ],
                },
                "isName": false,
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
    const initialSchema = createAdminSchema({});
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
                "authKeyPattern": null,
                "fields": [],
                "name": "NewType",
              },
            ],
            "patterns": [],
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
