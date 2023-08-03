import {
  AdminSchema,
  AdminSchemaWithMigrations,
  FieldType,
  RichTextNodeType,
  type AdminEntityTypeSpecificationUpdate,
  type NumberFieldSpecification,
  type StringFieldSpecification,
} from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import {
  REQUIRED_NODES_PLACEHOLDER,
  SchemaEditorActions,
  getSchemaSpecificationUpdateFromEditorState,
  initializeSchemaEditorState,
  reduceSchemaEditorState,
  type SchemaEditorState,
  type SchemaEditorStateAction,
  type SchemaTypeDraft,
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

// smaller snapshots
function stateWithoutExistingSchema(state: Readonly<SchemaEditorState>) {
  function removeFieldSpecs(typeDraft: Readonly<SchemaTypeDraft>) {
    const fields = typeDraft.fields.map((fieldDraft) => {
      const { existingFieldSpec, ...other } = fieldDraft;
      return other;
    });
    return { ...typeDraft, fields };
  }

  const entityTypes = state.entityTypes.map(removeFieldSpecs);
  const valueTypes = state.valueTypes.map(removeFieldSpecs);
  const indexes = state.indexes.map((index) => {
    const { existingIndexSpec, ...other } = index;
    return other;
  });
  const { schema, ...other } = state;
  return { ...other, entityTypes, valueTypes, indexes };
}

describe('initializeSchemaEditorState', () => {
  test('no args', () => {
    const state = initializeSchemaEditorState();
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
  });
});

describe('AddTypeAction', () => {
  test('add entity type to empty schema', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('entity', 'Foo'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add value type to empty schema', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('value', 'Foo'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add entity type to schema with existing type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('entity', 'Bar'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add value type to schema with existing type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('value', 'Bar'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add two entity types (orders)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('entity', 'ZooKeeper'),
      new SchemaEditorActions.AddType('entity', 'Anaconda'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add two value types (orders)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('value', 'ZooKeeper'),
      new SchemaEditorActions.AddType('value', 'Anaconda'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('AddFieldAction', () => {
  test('add field to existing entity type (without any fields)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add field to existing value type (without any fields)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'bar'),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add field to existing entity type (with existing fields)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [{ name: 'title', type: FieldType.String }] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add field to existing value type (with existing fields)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          valueTypes: [{ name: 'Foo', fields: [{ name: 'title', type: FieldType.String }] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'bar'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('AddIndexAction', () => {
  test('add index to empty schema', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddIndex('myIndex'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('AddPatternAction', () => {
  test('add pattern to empty schema', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddPattern('my-pattern'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('ChangeFieldAdminOnlyAction', () => {
  test('make new field admin only in existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldAdminOnly(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        true,
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('make existing field admin only', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.Boolean }] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ChangeFieldAdminOnly(
        { kind: 'entity', typeName: 'Foo', fieldName: 'field' },
        true,
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    expect(state.entityTypes[0].fields[0].status).toBe('changed');

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('ChangeFieldAllowedEntityTypesAction', () => {
  test('change entity types of a new entity field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'foo'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        FieldType.Entity,
        false,
      ),
      new SchemaEditorActions.ChangeFieldAllowedEntityTypes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        ['Foo'],
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('change entity types of existing entity field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            { name: 'Foo', fields: [{ name: 'entity', type: FieldType.Entity, entityTypes: [] }] },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ChangeFieldAllowedEntityTypes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'entity' },
        ['Foo'],
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('ChangeFieldAllowedLinkEntityTypesAction', () => {
  test('change link entity types of a new rich text field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'foo'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        FieldType.RichText,
        false,
      ),
      new SchemaEditorActions.ChangeFieldAllowedLinkEntityTypes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        ['Foo'],
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('change link entity types of existing rich text field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [{ name: 'foo', type: FieldType.RichText }] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ChangeFieldAllowedLinkEntityTypes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        ['Foo'],
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('ChangeFieldAllowedRichTextNodesAction', () => {
  test('change node types (add entity) of a new rich text field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'foo'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        FieldType.RichText,
        false,
      ),
      new SchemaEditorActions.ChangeFieldAllowedRichTextNodes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        [RichTextNodeType.entity],
      ),
      new SchemaEditorActions.ChangeFieldAllowedEntityTypes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        ['Foo'],
      ),
    );
    expect(state.entityTypes[0].fields[0].richTextNodesWithPlaceholders).toEqual([
      'root, paragraph, text, linebreak, tab',
      RichTextNodeType.entity,
    ]);
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('change node types (add entity) of an existing rich text field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [
                {
                  name: 'rt',
                  type: FieldType.RichText,
                  richTextNodes: [
                    RichTextNodeType.root,
                    RichTextNodeType.paragraph,
                    RichTextNodeType.text,
                    RichTextNodeType.linebreak,
                    RichTextNodeType.tab,
                    RichTextNodeType.heading,
                  ],
                },
              ],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ChangeFieldAllowedRichTextNodes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'rt' },
        [REQUIRED_NODES_PLACEHOLDER.name, RichTextNodeType.heading, RichTextNodeType.entity],
      ),
    );
    expect(state.entityTypes[0].fields[0].richTextNodesWithPlaceholders).toEqual([
      'root, paragraph, text, linebreak, tab',
      RichTextNodeType.entity,
      RichTextNodeType.heading,
    ]);
    expect(state.entityTypes[0].fields[0].status).toBe('changed');

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('change node types (remove entity) of an existing rich text field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [
                {
                  name: 'rt',
                  type: FieldType.RichText,
                  richTextNodes: [
                    RichTextNodeType.root,
                    RichTextNodeType.paragraph,
                    RichTextNodeType.text,
                    RichTextNodeType.linebreak,
                    RichTextNodeType.tab,
                    RichTextNodeType.heading,
                    RichTextNodeType.entity,
                  ],
                },
              ],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ChangeFieldAllowedRichTextNodes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'rt' },
        [REQUIRED_NODES_PLACEHOLDER.name, RichTextNodeType.heading],
      ),
    );
    expect(state.entityTypes[0].fields[0].richTextNodesWithPlaceholders).toEqual([
      'root, paragraph, text, linebreak, tab',
      RichTextNodeType.heading,
    ]);
    expect(state.entityTypes[0].fields[0].status).toBe('changed');

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('ChangeFieldAllowedValueTypesAction', () => {
  test('change value types of a new value item field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'foo'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'value', typeName: 'Foo', fieldName: 'foo' },
        FieldType.ValueItem,
        false,
      ),
      new SchemaEditorActions.ChangeFieldAllowedValueTypes(
        { kind: 'value', typeName: 'Foo', fieldName: 'foo' },
        ['Foo'],
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('change value types of a existing value item field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          valueTypes: [{ name: 'Foo', fields: [{ name: 'valueItem', type: FieldType.ValueItem }] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ChangeFieldAllowedValueTypes(
        { kind: 'value', typeName: 'Foo', fieldName: 'valueItem' },
        ['Foo'],
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldIndex(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        'anIndex',
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].index).toBe('anIndex');
    expect((schemaUpdate.entityTypes?.[0].fields[0] as StringFieldSpecification).index).toBe(
      'anIndex',
    );
  });

  test('set index on existing string field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'existing', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddIndex('anIndex'),
      new SchemaEditorActions.ChangeFieldIndex(
        { kind: 'entity', typeName: 'Foo', fieldName: 'existing' },
        'anIndex',
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].status).toBe('changed');
    expect((schemaUpdate.entityTypes?.[0].fields[0] as StringFieldSpecification).index).toBe(
      'anIndex',
    );
  });
});

describe('ChangeFieldIntegerAction', () => {
  test('make new integer field in existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        FieldType.Number,
        false,
      ),
      new SchemaEditorActions.ChangeFieldInteger(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        true,
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].integer).toBe(true);
    expect((schemaUpdate?.entityTypes?.[0].fields[0] as NumberFieldSpecification).integer).toBe(
      true,
    );
  });

  test('make existing integer field into float', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            { name: 'Foo', fields: [{ name: 'bar', type: FieldType.Number, integer: true }] },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ChangeFieldInteger(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        false,
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].integer).toBe(false);
    expect((schemaUpdate?.entityTypes?.[0].fields[0] as NumberFieldSpecification).integer).toBe(
      false,
    );
  });
});

describe('ChangeTypeNameField', () => {
  test('make new string the name field in new type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('entity', 'TitleOnly'),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'TitleOnly' }, 'title'),
      new SchemaEditorActions.ChangeTypeNameField(
        { kind: 'entity', typeName: 'TitleOnly' },
        'title',
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].nameField).toBe('title');
    expect((schemaUpdate?.entityTypes?.[0] as AdminEntityTypeSpecificationUpdate).nameField).toBe(
      'title',
    );
  });

  test('make other field is-name, and switch back', () => {
    let state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'TitleOnly',
              nameField: 'title',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'TitleOnly' }, 'other'),
      new SchemaEditorActions.ChangeTypeNameField(
        { kind: 'entity', typeName: 'TitleOnly' },
        'other',
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    let titleOnlyDraft = state.entityTypes[0];
    expect(titleOnlyDraft.nameField).toBe('other');
    expect(titleOnlyDraft.status).toBe('changed');

    // Change back
    state = reduceSchemaEditorStateActions(
      state,
      new SchemaEditorActions.ChangeTypeNameField(
        { kind: 'entity', typeName: 'TitleOnly' },
        'title',
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    titleOnlyDraft = state.entityTypes[0];
    expect(titleOnlyDraft.nameField).toBe('title');
    expect(titleOnlyDraft.status).toBe('changed'); // since we added a field
  });
});

describe('ChangeFieldMatchPattern', () => {
  test('set pattern on new string field in existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.AddPattern('aPattern'),
      new SchemaEditorActions.ChangePatternPattern({ kind: 'pattern', name: 'aPattern' }, '^.*$'),
      new SchemaEditorActions.ChangeFieldMatchPattern(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        'aPattern',
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].matchPattern).toBe('aPattern');
    expect((schemaUpdate.entityTypes?.[0].fields[0] as StringFieldSpecification).matchPattern).toBe(
      'aPattern',
    );
  });

  test('change pattern on existing string field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'bar', type: FieldType.String, matchPattern: 'aPattern' }],
            },
          ],
          patterns: [{ name: 'aPattern', pattern: '^.+$' }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddPattern('anotherPattern'),
      new SchemaEditorActions.ChangePatternPattern(
        { kind: 'pattern', name: 'anotherPattern' },
        '^hello$',
      ),
      new SchemaEditorActions.ChangeFieldMatchPattern(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        'anotherPattern',
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].matchPattern).toBe('anotherPattern');
    expect((schemaUpdate.entityTypes?.[0].fields[0] as StringFieldSpecification).matchPattern).toBe(
      'anotherPattern',
    );
  });
});

describe('ChangeFieldMultilineAction', () => {
  test('make new multiline field in existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldMultiline(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        true,
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].multiline).toBe(true);
    expect((schemaUpdate?.entityTypes?.[0].fields[0] as StringFieldSpecification).multiline).toBe(
      true,
    );
  });

  test('change multiline in existing string field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [{ name: 'bar', type: FieldType.String }] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ChangeFieldMultiline(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        true,
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].multiline).toBe(true);
    expect(state.entityTypes[0].fields[0].status).toBe('changed');
    expect(state.entityTypes[0].status).toBe('changed');
    expect(state.status).toBe('changed');
    expect((schemaUpdate?.entityTypes?.[0].fields[0] as StringFieldSpecification).multiline).toBe(
      true,
    );
  });
});

describe('ChangeFieldRequiredAction', () => {
  test('make new field required in existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldRequired(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        true,
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('make existing field required', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            { name: 'Foo', fields: [{ name: 'bar', type: FieldType.String, required: false }] },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ChangeFieldRequired(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        true,
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('ChangeFieldTypeAction', () => {
  test('from string to location list (new field of existing entity type)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        FieldType.Location,
        true,
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('from string to location list (new field of existing value type)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'value', typeName: 'Foo', fieldName: 'bar' },
        FieldType.Location,
        true,
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('from string to number (new field of existing value type)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'value', typeName: 'Foo', fieldName: 'bar' },
        FieldType.Number,
        false,
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('from string to entity (new field of existing entity type)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        FieldType.Entity,
        false,
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('from string to value (new field of existing entity type)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        FieldType.ValueItem,
        false,
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('ChangeFieldValues', () => {
  test('set values on new string field in existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldValues(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }],
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].values).toEqual([
      { value: 'bar' },
      { value: 'baz' },
      { value: 'foo' },
    ]);
    expect((schemaUpdate.entityTypes?.[0].fields[0] as StringFieldSpecification).values).toEqual([
      { value: 'bar' },
      { value: 'baz' },
      { value: 'foo' },
    ]);
  });

  test('set values on existing string field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [
                {
                  name: 'bar',
                  type: FieldType.String,
                  values: [{ value: 'hello' }, { value: 'extra' }],
                },
              ],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ChangeFieldValues(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        // wrong order and duplicate values
        [{ value: 'world' }, { value: 'hello' }, { value: 'hello' }],
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].values).toEqual([{ value: 'hello' }, { value: 'world' }]);
    expect((schemaUpdate.entityTypes?.[0].fields[0] as StringFieldSpecification).values).toEqual([
      { value: 'hello' },
      { value: 'world' },
    ]);
  });
});

describe('ChangePatternPatternAction', () => {
  test('change pattern of new pattern', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddPattern('foo'),
      new SchemaEditorActions.ChangePatternPattern(
        { kind: 'pattern', name: 'foo' },
        '^this is a new pattern$',
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('change pattern of existing pattern', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'bar', type: FieldType.String, matchPattern: 'aPattern' }],
            },
          ],
          patterns: [{ name: 'aPattern', pattern: '^this is a pattern$' }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ChangePatternPattern(
        { kind: 'pattern', name: 'aPattern' },
        '^this is a new pattern$',
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('ChangeTypeAdminOnlyAction', () => {
  test('make new entity type admin only', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('entity', 'Foo'),
      new SchemaEditorActions.ChangeTypeAdminOnly({ kind: 'entity', typeName: 'Foo' }, true),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('make existing entity type admin only', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ChangeTypeAdminOnly({ kind: 'entity', typeName: 'Foo' }, true),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    expect(state.entityTypes[0].status).toEqual('changed');

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('make existing value type admin only', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow(),
      ),
      new SchemaEditorActions.ChangeTypeAdminOnly({ kind: 'value', typeName: 'Foo' }, true),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    expect(state.valueTypes[0].status).toEqual('changed');

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('DeleteFieldAction', () => {
  test('add and delete field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [{ name: 'title', type: FieldType.String }] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.SetActiveSelector(
        {
          kind: 'entity',
          typeName: 'Foo',
          fieldName: 'bar',
        },
        true,
        true,
      ),
      new SchemaEditorActions.DeleteField({ kind: 'entity', typeName: 'Foo', fieldName: 'bar' }),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
  });

  test('add field, set as name field and delete field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeTypeNameField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.DeleteField({ kind: 'entity', typeName: 'Foo', fieldName: 'bar' }),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(state.entityTypes[0].nameField).toBe(null);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
  });

  test('delete existing entity name field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              nameField: 'title',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.DeleteField({ kind: 'entity', typeName: 'Foo', fieldName: 'title' }),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('delete existing value item field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          valueTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.DeleteField({ kind: 'value', typeName: 'Foo', fieldName: 'field' }),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('DeleteIndexAction', () => {
  test('delete index used', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'EntityType',
              fields: [{ name: 'fieldA', type: FieldType.String, index: 'anIndex' }],
            },
          ],
          valueTypes: [
            {
              name: 'ValueType',
              fields: [{ name: 'fieldB', type: FieldType.String, index: 'anIndex' }],
            },
          ],
          indexes: [{ name: 'anIndex', type: 'unique' }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.SetActiveSelector({ kind: 'index', name: 'anIndex' }, false, false),
      new SchemaEditorActions.DeleteIndex({ kind: 'index', name: 'anIndex' }),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].index).toBe(null);
    expect(state.entityTypes[0].fields[0].status).toBe('changed');

    expect(state.valueTypes[0].fields[0].index).toBe(null);
    expect(state.valueTypes[0].fields[0].status).toBe('changed');

    expect(state.indexes.length).toBe(0);

    expect(state.activeSelector).toBe(null);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('DeletePatternAction', () => {
  test('delete pattern used as authKeyPattern and matchPattern', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              authKeyPattern: 'patternA',
              fields: [{ name: 'fieldA', type: FieldType.String, matchPattern: 'patternA' }],
            },
          ],
          patterns: [{ name: 'patternA', pattern: '^patternA$' }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.SetActiveSelector(
        { kind: 'pattern', name: 'patternA' },
        false,
        false,
      ),
      new SchemaEditorActions.DeletePattern({ kind: 'pattern', name: 'patternA' }),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(state.entityTypes[0].authKeyPattern).toBe(null);
    expect(state.entityTypes[0].status).toBe('changed');

    expect(state.entityTypes[0].fields[0].matchPattern).toBe(null);
    expect(state.entityTypes[0].fields[0].status).toBe('changed');

    expect(state.patterns.length).toBe(0);

    expect(state.activeSelector).toBe(null);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('DeleteTypeAction', () => {
  test('delete newly added entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('entity', 'Foo'),
      new SchemaEditorActions.DeleteType({ kind: 'entity', typeName: 'Foo' }),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});

    expect(state.status).toBe(''); // should be reset
  });

  test('delete existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.DeleteType({ kind: 'entity', typeName: 'Foo' }),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('delete newly added entity type referenced by another type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Existing',
              fields: [
                { name: 'entity', type: FieldType.Entity },
                { name: 'richText', type: FieldType.RichText },
              ],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('entity', 'Foo'),
      new SchemaEditorActions.ChangeFieldAllowedEntityTypes(
        { kind: 'entity', typeName: 'Existing', fieldName: 'entity' },
        ['Foo'],
      ),
      new SchemaEditorActions.ChangeFieldAllowedEntityTypes(
        { kind: 'entity', typeName: 'Existing', fieldName: 'richText' },
        ['Foo'],
      ),
      new SchemaEditorActions.ChangeFieldAllowedLinkEntityTypes(
        { kind: 'entity', typeName: 'Existing', fieldName: 'richText' },
        ['Foo'],
      ),
      new SchemaEditorActions.DeleteType({ kind: 'entity', typeName: 'Foo' }),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].entityTypes).toEqual([]);
    expect(state.entityTypes[0].fields[1].linkEntityTypes).toEqual([]);
    expect(state.entityTypes[0].fields[1].entityTypes).toEqual([]);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});

    expect(state.status).toBe(''); // should be reset
  });

  test('delete existing entity type referenced by another type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'ToBeDeleted', fields: [] }],
          valueTypes: [
            {
              name: 'Referencing',
              fields: [
                { name: 'entity', type: FieldType.Entity, entityTypes: ['ToBeDeleted'] },
                {
                  name: 'richText',
                  type: FieldType.RichText,
                  entityTypes: ['ToBeDeleted'],
                  linkEntityTypes: ['ToBeDeleted'],
                },
              ],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.DeleteType({ kind: 'entity', typeName: 'ToBeDeleted' }),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(state.valueTypes[0].fields[0].entityTypes).toEqual([]);
    expect(state.valueTypes[0].fields[1].entityTypes).toEqual([]);
    expect(state.valueTypes[0].fields[1].linkEntityTypes).toEqual([]);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('delete newly added value type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('value', 'Foo'),
      new SchemaEditorActions.DeleteType({ kind: 'value', typeName: 'Foo' }),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
    expect(state.status).toBe(''); // should be reset
  });

  test('delete existing value type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow(),
      ),
      new SchemaEditorActions.DeleteType({ kind: 'value', typeName: 'Foo' }),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('delete newly added value type referenced by another type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Existing',
              fields: [
                { name: 'richText', type: FieldType.RichText },
                { name: 'valueItem', type: 'ValueItem' },
              ],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('value', 'Foo'),
      new SchemaEditorActions.ChangeFieldAllowedValueTypes(
        { kind: 'entity', typeName: 'Existing', fieldName: 'richText' },
        ['Foo'],
      ),
      new SchemaEditorActions.ChangeFieldAllowedValueTypes(
        { kind: 'entity', typeName: 'Existing', fieldName: 'valueItem' },
        ['Foo'],
      ),
      new SchemaEditorActions.DeleteType({ kind: 'value', typeName: 'Foo' }),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].valueTypes).toEqual([]);
    expect(state.entityTypes[0].fields[1].valueTypes).toEqual([]);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
    expect(state.status).toBe(''); // should be reset
  });

  test('delete existing value type referenced by another type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Referencing',
              fields: [
                { name: 'richText', type: FieldType.RichText, valueTypes: ['ToBeDeleted'] },
                { name: 'valueItem', type: FieldType.ValueItem, valueTypes: ['ToBeDeleted'] },
              ],
            },
          ],
          valueTypes: [{ name: 'ToBeDeleted', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.DeleteType({ kind: 'value', typeName: 'ToBeDeleted' }),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].valueTypes).toEqual([]);
    expect(state.entityTypes[0].fields[1].valueTypes).toEqual([]);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('ChangeTypeAuthKeyPatternAction', () => {
  test('change pattern for new entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('entity', 'Foo'),
      new SchemaEditorActions.AddPattern('my-pattern'),
      new SchemaEditorActions.ChangeTypeAuthKeyPattern(
        { kind: 'entity', typeName: 'Foo' },
        'my-pattern',
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('change pattern for existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', authKeyPattern: 'aPattern', fields: [] }],
          patterns: [{ name: 'aPattern', pattern: '^this is a pattern$' }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ChangeTypeAuthKeyPattern({ kind: 'entity', typeName: 'Foo' }, null),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    expect(state.entityTypes[0].status).toBe('changed');

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
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.RenameField(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        'baz',
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add field, set as name field and rename', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeTypeNameField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.RenameField(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        'baz',
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(state.entityTypes[0].nameField).toBe('baz');

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('rename existing entity name field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              nameField: 'oldName',
              fields: [{ name: 'oldName', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.RenameField(
        { kind: 'entity', typeName: 'Foo', fieldName: 'oldName' },
        'newName',
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    expect(state.entityTypes[0].fields[0].status).toBe('changed');
    expect(state.entityTypes[0].nameField).toBe('newName');

    const update = getSchemaSpecificationUpdateFromEditorState(state);
    expect(update).toMatchSnapshot();
    expect(update.migrations?.[0].actions).toHaveLength(1);
  });

  test('rename existing value item field', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          valueTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'oldName', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.RenameField(
        { kind: 'value', typeName: 'Foo', fieldName: 'oldName' },
        'newName',
      ),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    expect(state.valueTypes[0].fields[0].status).toBe('changed');

    const update = getSchemaSpecificationUpdateFromEditorState(state);
    expect(update).toMatchSnapshot();
    expect(update.migrations?.[0].actions).toHaveLength(1);
  });
});

describe('RenameIndexAction', () => {
  test('rename existing index', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'EntityType',
              fields: [{ name: 'fieldA', type: FieldType.String, index: 'oldName' }],
            },
          ],
          indexes: [{ name: 'oldName', type: 'unique' }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.RenameIndex({ kind: 'index', name: 'oldName' }, 'newName'),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(state.entityTypes[0].status).toBe('changed');

    expect(state.entityTypes[0].fields[0].index).toBe('newName');
    expect(state.entityTypes[0].fields[0].status).toBe('changed');

    expect(state.indexes[0].name).toBe('newName');

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('RenamePatternAction', () => {
  test('rename pattern used as authKeyPattern and matchPattern', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              authKeyPattern: 'patternA',
              fields: [
                { name: 'fieldA', type: FieldType.String, matchPattern: 'patternA' },
                { name: 'fieldB', type: FieldType.String, matchPattern: 'patternB' },
              ],
            },
          ],
          patterns: [
            { name: 'patternA', pattern: '^patternA$' },
            { name: 'patternB', pattern: '^patternB$' },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.RenamePattern({ kind: 'pattern', name: 'patternA' }, 'patternC'),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(state.entityTypes[0].authKeyPattern).toBe('patternC');
    expect(state.entityTypes[0].status).toBe('changed');

    expect(state.entityTypes[0].fields[0].matchPattern).toBe('patternC');
    expect(state.entityTypes[0].fields[0].status).toBe('changed');

    expect(state.patterns[1].name).toBe('patternC');
    expect(state.patterns[1].status).toBe('changed');

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('RenameTypeAction', () => {
  test('add and rename type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('entity', 'Foo'),
      new SchemaEditorActions.RenameType({ kind: 'entity', typeName: 'Foo' }, 'Bar'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add and rename entity type with fields referring to itself', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('entity', 'Foo'),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'self'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'self' },
        FieldType.Entity,
        false,
      ),
      new SchemaEditorActions.ChangeFieldAllowedEntityTypes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'self' },
        ['Foo'],
      ),
      new SchemaEditorActions.RenameType({ kind: 'entity', typeName: 'Foo' }, 'Bar'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    expect(state.entityTypes[0].name).toBe('Bar');
    expect(state.entityTypes[0].fields[0].entityTypes).toEqual(['Bar']);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add and rename entity type with link fields referring to itself', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('entity', 'Foo'),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'self'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'self' },
        FieldType.RichText,
        false,
      ),
      new SchemaEditorActions.ChangeFieldAllowedLinkEntityTypes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'self' },
        ['Foo'],
      ),
      new SchemaEditorActions.RenameType({ kind: 'entity', typeName: 'Foo' }, 'Bar'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    expect(state.entityTypes[0].name).toBe('Bar');
    expect(state.entityTypes[0].fields[0].linkEntityTypes).toEqual(['Bar']);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('rename existing entity type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'OldName', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.RenameType({ kind: 'entity', typeName: 'OldName' }, 'NewName'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    state.entityTypes[0].status = 'changed';

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('rename existing entity type with fields referring to itself', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'OldName',
              fields: [{ name: 'self', type: FieldType.Entity, entityTypes: ['OldName'] }],
            },
          ],
          valueTypes: [
            {
              name: 'Referencing',
              fields: [{ name: 'field', type: FieldType.Entity, entityTypes: ['OldName'] }],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.RenameType({ kind: 'entity', typeName: 'OldName' }, 'NewName'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add and rename value type with fields referring to itself', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
      new SchemaEditorActions.AddType('value', 'Foo'),
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'self'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'value', typeName: 'Foo', fieldName: 'self' },
        FieldType.ValueItem,
        false,
      ),
      new SchemaEditorActions.ChangeFieldAllowedValueTypes(
        { kind: 'value', typeName: 'Foo', fieldName: 'self' },
        ['Foo'],
      ),
      new SchemaEditorActions.RenameType({ kind: 'value', typeName: 'Foo' }, 'Bar'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    expect(state.valueTypes[0].name).toBe('Bar');
    expect(state.valueTypes[0].fields[0].valueTypes).toEqual(['Bar']);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('rename existing value type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow(),
      ),
      new SchemaEditorActions.RenameType({ kind: 'value', typeName: 'Foo' }, 'Bar'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();
    state.valueTypes[0].status = 'changed';

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('rename existing value type with fields referring to itself', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            { name: 'Baz', fields: [{ name: 'field', type: 'ValueItem', valueTypes: ['Foo'] }] },
          ],
          valueTypes: [
            {
              name: 'Foo',
              fields: [{ name: 'self', type: FieldType.ValueItem, valueTypes: ['Foo'] }],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.RenameType({ kind: 'value', typeName: 'Foo' }, 'Bar'),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('ReorderFieldsAction', () => {
  test('three fields, move first to middle', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [
                { name: 'fieldA', type: FieldType.Boolean },
                { name: 'fieldB', type: FieldType.Boolean },
                { name: 'fieldC', type: FieldType.Boolean },
              ],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ReorderFields(
        { kind: 'entity', typeName: 'Foo' },
        'fieldA',
        'after',
        'fieldB',
      ),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(state.entityTypes[0].status).toBe('changed');
    expect(state.entityTypes[0].fields.map((it) => it.name)).toEqual([
      'fieldB',
      'fieldA',
      'fieldC',
    ]);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('two fields, move last to first', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Foo',
              fields: [
                { name: 'fieldA', type: FieldType.Boolean },
                { name: 'fieldB', type: FieldType.Boolean },
              ],
            },
          ],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.ReorderFields(
        { kind: 'entity', typeName: 'Foo' },
        'fieldB',
        'before',
        'fieldA',
      ),
    );

    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(state.entityTypes[0].status).toBe('changed');
    expect(state.entityTypes[0].fields.map((it) => it.name)).toEqual(['fieldB', 'fieldA']);

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });
});

describe('SetActiveSelectorAction', () => {
  test('set to type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.SetActiveSelector({ kind: 'entity', typeName: 'Foo' }, false, false),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
  });

  test('set to type with editor scroll', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', fields: [] }],
        }).valueOrThrow(),
      ),
      new SchemaEditorActions.SetActiveSelector({ kind: 'entity', typeName: 'Foo' }, false, true),
    );
    expect(stateWithoutExistingSchema(state)).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
  });
});

describe('UpdateSchemaSpecificationAction', () => {
  test('add empty schema', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow(),
      ),
    );
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
  });

  test('one entity type', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'TitleOnly',
              nameField: 'title',
              fields: [{ name: 'title', type: FieldType.String }],
            },
          ],
        }).valueOrThrow(),
      ),
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
  });

  test('one entity type with number fields', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'Numbers',
              fields: [
                { name: 'float', type: FieldType.Number, integer: false },
                { name: 'integer', type: FieldType.Number, integer: true },
                { name: 'floats', type: FieldType.Number, integer: false, list: true },
                { name: 'integers', type: FieldType.Number, integer: true, list: true },
              ],
            },
          ],
        }).valueOrThrow(),
      ),
    );

    expect(state.entityTypes[0].fields[0].integer).toBe(false);
    expect(state.entityTypes[0].fields[1].integer).toBe(true);

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
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
                  matchPattern: 'aPattern',
                },
              ],
            },
          ],
          patterns: [{ name: 'aPattern', pattern: '^a-pattern$' }],
        }).valueOrThrow(),
      ),
    );

    expect(state.entityTypes[0].fields[0].multiline).toBe(true);
    expect(state.entityTypes[0].fields[0].matchPattern).toBe('aPattern');

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
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
                    RichTextNodeType.linebreak,
                    RichTextNodeType.tab,
                    RichTextNodeType.list,
                    RichTextNodeType.listitem,
                    RichTextNodeType.entity,
                  ],
                },
              ],
            },
          ],
        }).valueOrThrow(),
      ),
    );

    expect(state.entityTypes[0].fields[0].richTextNodesWithPlaceholders).toEqual([
      'root, paragraph, text, linebreak, tab',
      RichTextNodeType.entity,
      'list, listitem',
    ]);

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
  });

  test('one value type', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          valueTypes: [{ name: 'TitleOnly', fields: [{ name: 'title', type: FieldType.String }] }],
        }).valueOrThrow(),
      ),
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
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
                { name: 'reference', type: FieldType.Entity, entityTypes: ['EntityReference'] },
              ],
            },
          ],
          valueTypes: [
            {
              name: 'ValueReference',
              fields: [
                { name: 'reference', type: FieldType.Entity, entityTypes: ['EntityReference'] },
              ],
            },
          ],
        }).valueOrThrow(),
      ),
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
  });

  test('value type field', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [
            {
              name: 'EntityWithValueItem',
              fields: [{ name: 'valueItem', type: FieldType.ValueItem, valueTypes: ['ValueItem'] }],
            },
          ],
          valueTypes: [
            {
              name: 'ValueItem',
              fields: [{ name: 'valueItem', type: FieldType.ValueItem, valueTypes: ['ValueItem'] }],
            },
          ],
        }).valueOrThrow(),
      ),
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
  });

  test('entity type with auth key pattern', () => {
    const state = reduceSchemaEditorState(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({
          entityTypes: [{ name: 'Foo', authKeyPattern: 'patternOne', fields: [] }],
          patterns: [{ name: 'patternOne', pattern: '^foo$' }],
        }).valueOrThrow(),
      ),
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
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
        }).valueOrThrow(),
      ),
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
  });
});

describe('SchemaEditorReducer scenarios', () => {
  test('add type, save, force update', () => {
    const initialSchema = AdminSchemaWithMigrations.createAndValidate({}).valueOrThrow();
    const beforeSaveState = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(initialSchema),
      new SchemaEditorActions.AddType('entity', 'NewType'),
      new SchemaEditorActions.SetNextUpdateSchemaSpecificationIsDueToSave(true),
    );

    const newAdminSchema = initialSchema
      .updateAndValidate(getSchemaSpecificationUpdateFromEditorState(beforeSaveState))
      .valueOrThrow();

    const afterSaveState = reduceSchemaEditorState(
      beforeSaveState,
      new SchemaEditorActions.UpdateSchemaSpecification(newAdminSchema),
    );

    expect(afterSaveState).toMatchSnapshot();
  });
});
