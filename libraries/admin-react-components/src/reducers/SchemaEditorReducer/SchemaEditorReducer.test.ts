import { AdminSchema, assertIsDefined, FieldType, RichTextNodeType } from '@jonasb/datadata-core';
import { describe, expect, test } from 'vitest';
import type { SchemaEditorState, SchemaEditorStateAction } from './SchemaEditorReducer.js';
import {
  getSchemaSpecificationUpdateFromEditorState,
  initializeSchemaEditorState,
  reduceSchemaEditorState,
  ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER,
  SchemaEditorActions,
} from './SchemaEditorReducer.js';

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
        "indexes": [],
        "patterns": [],
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
        AdminSchema.createAndValidate({}).valueOrThrow()
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
            "authKeyPattern": null,
            "fields": [],
            "kind": "entity",
            "name": "Foo",
            "status": "new",
          },
        ],
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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
            "authKeyPattern": null,
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
        AdminSchema.createAndValidate({}).valueOrThrow()
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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
        AdminSchema.createAndValidate({ entityTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
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
            "authKeyPattern": null,
            "fields": [],
            "kind": "entity",
            "name": "Bar",
            "status": "new",
          },
          {
            "adminOnly": false,
            "authKeyPattern": null,
            "fields": [],
            "kind": "entity",
            "name": "Foo",
            "status": "",
          },
        ],
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "indexes": [],
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
            "authKeyPattern": null,
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
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
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
            "authKeyPattern": null,
            "fields": [],
            "kind": "entity",
            "name": "Anaconda",
            "status": "new",
          },
          {
            "adminOnly": false,
            "authKeyPattern": null,
            "fields": [],
            "kind": "entity",
            "name": "ZooKeeper",
            "status": "new",
          },
        ],
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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
            "authKeyPattern": null,
            "fields": [],
            "name": "Anaconda",
          },
          {
            "adminOnly": false,
            "authKeyPattern": null,
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
        AdminSchema.createAndValidate({}).valueOrThrow()
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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
        AdminSchema.createAndValidate({ entityTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
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
            "authKeyPattern": null,
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "indexes": [],
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
            "authKeyPattern": null,
            "fields": [
              {
                "adminOnly": false,
                "index": null,
                "matchPattern": null,
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
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
      ),
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'bar')
    );
    expect(state).toMatchInlineSnapshot(`
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [],
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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
                "index": null,
                "matchPattern": null,
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
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [{ name: 'title', type: FieldType.String }] }],
        }).valueOrThrow()
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
            "authKeyPattern": null,
            "fields": [
              {
                "adminOnly": false,
                "existingFieldSpec": {
                  "name": "title",
                  "type": "String",
                },
                "index": null,
                "isName": false,
                "list": false,
                "matchPattern": null,
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
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
            "indexes": [],
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
            "authKeyPattern": null,
            "fields": [
              {
                "adminOnly": false,
                "index": null,
                "matchPattern": null,
                "multiline": false,
                "name": "title",
                "required": false,
                "type": "String",
              },
              {
                "adminOnly": false,
                "index": null,
                "matchPattern": null,
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
        AdminSchema.createAndValidate({
          valueTypes: [{ name: 'Foo', fields: [{ name: 'title', type: FieldType.String }] }],
        }).valueOrThrow()
      ),
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'bar')
    );

    expect(state).toMatchInlineSnapshot(`
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [],
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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
                "index": null,
                "isName": false,
                "list": false,
                "matchPattern": null,
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
                "index": null,
                "matchPattern": null,
                "multiline": false,
                "name": "title",
                "required": false,
                "type": "String",
              },
              {
                "adminOnly": false,
                "index": null,
                "matchPattern": null,
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

describe('AddIndexAction', () => {
  test('add index to empty schema', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
      ),
      new SchemaEditorActions.AddIndex('myIndex')
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('AddPatternAction', () => {
  test('add pattern to empty schema', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
      ),
      new SchemaEditorActions.AddPattern('my-pattern')
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('ChangeFieldAdminOnlyAction', () => {
  test('make new field admin only in existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ entityTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
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
        AdminSchema.createAndValidate({ entityTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
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
            "authKeyPattern": null,
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "indexes": [],
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
            "authKeyPattern": null,
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

describe('ChangeFieldAllowedLinkEntityTypesAction', () => {
  test('change link entity types of a new entity field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ entityTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'foo'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        FieldType.RichText,
        false
      ),
      new SchemaEditorActions.ChangeFieldAllowedLinkEntityTypes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        ['Foo']
      )
    );
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('ChangeFieldAllowedRichTextNodesAction', () => {
  test('change node types (add entity) of a new rich text field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ entityTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
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
            "authKeyPattern": null,
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "indexes": [],
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
            "authKeyPattern": null,
            "fields": [
              {
                "adminOnly": false,
                "entityTypes": [
                  "Foo",
                ],
                "linkEntityTypes": [],
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
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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

describe('ChangeFieldIndexAction', () => {
  test('set index on new string field in existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'existing', type: FieldType.String, index: 'anIndex' }],
            },
          ],
          indexes: [{ name: 'anIndex', type: 'unique' }],
        }).valueOrThrow()
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldIndex(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        'anIndex'
      )
    );
    expect(state).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].index).toBe('anIndex');
    expect(schemaUpdate.entityTypes?.[0].fields[0].index).toBe('anIndex');
  });
});

describe('ChangeFieldIsNameAction', () => {
  test('make new string field is-name in new type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
      ),
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
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'TitleOnly',
              fields: [{ name: 'title', type: FieldType.String, isName: true }],
            },
          ],
        }).valueOrThrow()
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

describe('ChangeFieldMatchPattern', () => {
  test('set pattern on new string field in existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
          patterns: [{ name: 'a-pattern', pattern: '^.+$' }],
        }).valueOrThrow()
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldMatchPattern(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        'a-pattern'
      )
    );
    expect(state).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].matchPattern).toBe('a-pattern');
    expect(schemaUpdate.entityTypes?.[0].fields[0].matchPattern).toBe('a-pattern');
  });
});

describe('ChangeFieldMultilineAction', () => {
  test('make new multiline field in existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow()
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
        AdminSchema.createAndValidate({ entityTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
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
            "authKeyPattern": null,
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "indexes": [],
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
            "authKeyPattern": null,
            "fields": [
              {
                "adminOnly": false,
                "index": null,
                "matchPattern": null,
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
        AdminSchema.createAndValidate({ entityTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
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
            "authKeyPattern": null,
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "indexes": [],
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
            "authKeyPattern": null,
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
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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
        AdminSchema.createAndValidate({ entityTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
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
            "authKeyPattern": null,
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "indexes": [],
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
            "authKeyPattern": null,
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
        AdminSchema.createAndValidate({ entityTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
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
            "authKeyPattern": null,
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "indexes": [],
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
            "authKeyPattern": null,
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

describe('ChangePatternPatternAction', () => {
  test('change pattern of new pattern', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
      ),
      new SchemaEditorActions.AddPattern('foo'),
      new SchemaEditorActions.ChangePatternPattern(
        { kind: 'pattern', name: 'foo' },
        '^this is a new pattern$'
      )
    );
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('ChangeTypeAdminOnlyAction', () => {
  test('make new entity type admin only', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
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
            "authKeyPattern": null,
            "fields": [],
            "kind": "entity",
            "name": "Foo",
            "status": "new",
          },
        ],
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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
            "authKeyPattern": null,
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
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [{ name: 'title', type: FieldType.String }] }],
        }).valueOrThrow()
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
            "authKeyPattern": null,
            "fields": [
              {
                "adminOnly": false,
                "existingFieldSpec": {
                  "name": "title",
                  "type": "String",
                },
                "index": null,
                "isName": false,
                "list": false,
                "matchPattern": null,
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
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
            "indexes": [],
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
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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

describe('ChangeTypeAuthKeyPatternAction', () => {
  test('change pattern for new entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
      ),
      new SchemaEditorActions.AddType('entity', 'Foo'),
      new SchemaEditorActions.AddPattern('my-pattern'),
      new SchemaEditorActions.ChangeTypeAuthKeyPattern(
        { kind: 'entity', typeName: 'Foo' },
        'my-pattern'
      )
    );
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('RenameFieldAction', () => {
  test('add and rename field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [{ name: 'title', type: FieldType.String }] }],
        }).valueOrThrow()
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
            "authKeyPattern": null,
            "fields": [
              {
                "adminOnly": false,
                "existingFieldSpec": {
                  "name": "title",
                  "type": "String",
                },
                "index": null,
                "isName": false,
                "list": false,
                "matchPattern": null,
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
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
            "indexes": [],
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
            "authKeyPattern": null,
            "fields": [
              {
                "adminOnly": false,
                "index": null,
                "matchPattern": null,
                "multiline": false,
                "name": "title",
                "required": false,
                "type": "String",
              },
              {
                "adminOnly": false,
                "index": null,
                "matchPattern": null,
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
        AdminSchema.createAndValidate({}).valueOrThrow()
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
            "authKeyPattern": null,
            "fields": [],
            "kind": "entity",
            "name": "Bar",
            "status": "new",
          },
        ],
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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
            "authKeyPattern": null,
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
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
      ),
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

  test('add and rename entity type with link fields referring to itself', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
      ),
      new SchemaEditorActions.AddType('entity', 'Foo'),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'self'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'self' },
        FieldType.RichText,
        false
      ),
      new SchemaEditorActions.ChangeFieldAllowedLinkEntityTypes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'self' },
        ['Foo']
      ),
      new SchemaEditorActions.RenameType({ kind: 'entity', typeName: 'Foo' }, 'Bar')
    );

    expect(state).toMatchSnapshot();
    expect(state.entityTypes[0].name).toBe('Bar');
    expect(state.entityTypes[0].fields[0].linkEntityTypes).toEqual(['Bar']);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add and rename value type with fields referring to itself', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
      ),
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
        AdminSchema.createAndValidate({ entityTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
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
            "authKeyPattern": null,
            "fields": [],
            "kind": "entity",
            "name": "Foo",
            "status": "",
          },
        ],
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "indexes": [],
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
        AdminSchema.createAndValidate({ entityTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
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
            "authKeyPattern": null,
            "fields": [],
            "kind": "entity",
            "name": "Foo",
            "status": "",
          },
        ],
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "authKeyPattern": null,
                "fields": [],
                "name": "Foo",
              },
            ],
            "indexes": [],
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
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
      )
    );
    expect(state).toMatchInlineSnapshot(`
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [],
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'TitleOnly',
              fields: [{ name: 'title', type: FieldType.String, isName: true }],
            },
          ],
        }).valueOrThrow()
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
            "authKeyPattern": null,
            "fields": [
              {
                "adminOnly": false,
                "existingFieldSpec": {
                  "isName": true,
                  "name": "title",
                  "type": "String",
                },
                "index": null,
                "isName": true,
                "list": false,
                "matchPattern": null,
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
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
            "indexes": [],
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

  test('one entity type with string field', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'String',
              fields: [
                {
                  name: 'string',
                  type: FieldType.String,
                  multiline: true,
                  matchPattern: 'a-pattern',
                },
              ],
            },
          ],
          patterns: [{ name: 'a-pattern', pattern: '^a-pattern$' }],
        }).valueOrThrow()
      )
    );

    expect(state.entityTypes[0].fields[0].multiline).toBe(true);
    expect(state.entityTypes[0].fields[0].matchPattern).toBe('a-pattern');

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');
  });

  test('one entity type with rich text field', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'TitleOnly',
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
        }).valueOrThrow()
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
            "authKeyPattern": null,
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
                "linkEntityTypes": [],
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
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
            "indexes": [],
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
        AdminSchema.createAndValidate({
          valueTypes: [{ name: 'TitleOnly', fields: [{ name: 'title', type: FieldType.String }] }],
        }).valueOrThrow()
      )
    );

    expect(state).toMatchInlineSnapshot(`
      {
        "activeSelector": null,
        "activeSelectorEditorScrollSignal": 0,
        "activeSelectorMenuScrollSignal": 0,
        "entityTypes": [],
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [],
            "indexes": [],
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
                "index": null,
                "isName": false,
                "list": false,
                "matchPattern": null,
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
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'EntityReference',
              fields: [
                { name: 'reference', type: FieldType.EntityType, entityTypes: ['EntityReference'] },
              ],
            },
          ],
          valueTypes: [
            {
              name: 'ValueReference',
              fields: [
                { name: 'reference', type: FieldType.EntityType, entityTypes: ['EntityReference'] },
              ],
            },
          ],
        }).valueOrThrow()
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
            "authKeyPattern": null,
            "fields": [
              {
                "adminOnly": false,
                "entityTypes": [
                  "EntityReference",
                ],
                "existingFieldSpec": {
                  "entityTypes": [
                    "EntityReference",
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "authKeyPattern": null,
                "fields": [
                  {
                    "entityTypes": [
                      "EntityReference",
                    ],
                    "name": "reference",
                    "type": "EntityType",
                  },
                ],
                "name": "EntityReference",
              },
            ],
            "indexes": [],
            "patterns": [],
            "valueTypes": [
              {
                "adminOnly": false,
                "fields": [
                  {
                    "entityTypes": [
                      "EntityReference",
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
                  "EntityReference",
                ],
                "existingFieldSpec": {
                  "entityTypes": [
                    "EntityReference",
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
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'EntityWithValueItem',
              fields: [{ name: 'valueItem', type: FieldType.ValueType, valueTypes: ['ValueItem'] }],
            },
          ],
          valueTypes: [
            {
              name: 'ValueItem',
              fields: [{ name: 'valueItem', type: FieldType.ValueType, valueTypes: ['ValueItem'] }],
            },
          ],
        }).valueOrThrow()
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
            "authKeyPattern": null,
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
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
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
            "indexes": [],
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

  test('entity type with auth key pattern', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', authKeyPattern: 'pattern-one', fields: [] }],
          patterns: [{ name: 'pattern-one', pattern: '^foo$' }],
        }).valueOrThrow()
      )
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');
  });

  test('entity type with index and one index', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            { name: 'Foo', fields: [{ name: 'bar', type: FieldType.String, index: 'myIndex' }] },
          ],
          indexes: [{ name: 'myIndex', type: 'unique' }],
        }).valueOrThrow()
      )
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchInlineSnapshot('{}');
  });
});

describe('SchemaEditorReducer scenarios', () => {
  test('add type, save, force update', () => {
    const initialSchema = AdminSchema.createAndValidate({}).valueOrThrow();
    const beforeSaveState = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(initialSchema),
      new SchemaEditorActions.AddType('entity', 'NewType'),
      new SchemaEditorActions.SetNextUpdateSchemaSpecificationIsDueToSave(true)
    );

    const newAdminSchema = initialSchema
      .mergeWith(getSchemaSpecificationUpdateFromEditorState(beforeSaveState))
      .valueOrThrow();

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
            "authKeyPattern": null,
            "fields": [],
            "kind": "entity",
            "name": "NewType",
            "status": "",
          },
        ],
        "indexes": [],
        "patterns": [],
        "schema": AdminSchema {
          "cachedPatternRegExps": {},
          "spec": {
            "entityTypes": [
              {
                "adminOnly": false,
                "authKeyPattern": null,
                "fields": [],
                "name": "NewType",
              },
            ],
            "indexes": [],
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
