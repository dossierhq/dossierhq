import type { NumberFieldSpecification, StringFieldSpecification } from '@dossierhq/core';
import { AdminSchema, assertIsDefined, FieldType, RichTextNodeType } from '@dossierhq/core';
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
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
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

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add value type to empty schema', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({}).valueOrThrow()
      ),
      new SchemaEditorActions.AddType('value', 'Foo')
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add entity type to schema with existing type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ entityTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
      ),
      new SchemaEditorActions.AddType('entity', 'Bar')
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add value type to schema with existing type', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
      ),
      new SchemaEditorActions.AddType('value', 'Bar')
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('add field to existing value type (without any fields)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
      ),
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'bar')
    );
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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
        FieldType.Entity,
        false
      ),
      new SchemaEditorActions.ChangeFieldAllowedEntityTypes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'foo' },
        ['Foo']
      )
    );
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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
      'root, paragraph, text, linebreak',
      RichTextNodeType.entity,
    ]);
    expect(state).toMatchSnapshot();

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
                    RichTextNodeType.heading,
                  ],
                },
              ],
            },
          ],
        }).valueOrThrow()
      ),
      new SchemaEditorActions.ChangeFieldAllowedRichTextNodes(
        { kind: 'entity', typeName: 'Foo', fieldName: 'rt' },
        [
          ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER.name,
          RichTextNodeType.heading,
          RichTextNodeType.entity,
        ]
      )
    );
    expect(state.entityTypes[0].fields[0].richTextNodes).toEqual([
      'root, paragraph, text, linebreak',
      RichTextNodeType.heading,
      RichTextNodeType.entity,
    ]);
    expect(state.entityTypes[0].fields[0].status).toBe('changed');

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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
        FieldType.ValueItem,
        false
      ),
      new SchemaEditorActions.ChangeFieldAllowedValueTypes(
        { kind: 'value', typeName: 'Foo', fieldName: 'foo' },
        ['Foo']
      )
    );
    expect(state).toMatchSnapshot();

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
    expect((schemaUpdate.entityTypes?.[0].fields[0] as StringFieldSpecification).index).toBe(
      'anIndex'
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
        }).valueOrThrow()
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        FieldType.Number,
        false
      ),
      new SchemaEditorActions.ChangeFieldInteger(
        { kind: 'entity', typeName: 'Foo', fieldName: 'bar' },
        true
      )
    );
    expect(state).toMatchSnapshot();
    const schemaUpdate = getSchemaSpecificationUpdateFromEditorState(state);
    expect(schemaUpdate).toMatchSnapshot();

    expect(state.entityTypes[0].fields[0].integer).toBe(true);
    expect((schemaUpdate?.entityTypes?.[0].fields[0] as NumberFieldSpecification).integer).toBe(
      true
    );
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
    expect((schemaUpdate?.entityTypes?.[0].fields[0] as StringFieldSpecification).isName).toBe(
      true
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
    expect((schemaUpdate.entityTypes?.[0].fields[0] as StringFieldSpecification).matchPattern).toBe(
      'a-pattern'
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
    expect((schemaUpdate?.entityTypes?.[0].fields[0] as StringFieldSpecification).multiline).toBe(
      true
    );
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
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
  });

  test('from string to number (new field of existing value type)', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
      ),
      new SchemaEditorActions.AddField({ kind: 'value', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.ChangeFieldType(
        { kind: 'value', typeName: 'Foo', fieldName: 'bar' },
        FieldType.Number,
        false
      )
    );
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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
        FieldType.Entity,
        false
      )
    );
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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
        FieldType.ValueItem,
        false
      )
    );
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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
    expect(state).toMatchSnapshot();

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
        }).valueOrThrow()
      ),
      new SchemaEditorActions.AddField({ kind: 'entity', typeName: 'Foo' }, 'bar'),
      new SchemaEditorActions.DeleteField({ kind: 'entity', typeName: 'Foo', fieldName: 'bar' })
    );
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
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

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});

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

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
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
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toMatchSnapshot();
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
        FieldType.Entity,
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
        FieldType.ValueItem,
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
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
  });

  test('set to type with editor scroll', () => {
    const state = reduceSchemaEditorStateActions(
      initializeSchemaEditorState(),
      new SchemaEditorActions.UpdateSchemaSpecification(
        AdminSchema.createAndValidate({ entityTypes: [{ name: 'Foo', fields: [] }] }).valueOrThrow()
      ),
      new SchemaEditorActions.SetActiveSelector({ kind: 'entity', typeName: 'Foo' }, false, true)
    );
    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
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
              fields: [{ name: 'title', type: FieldType.String, isName: true }],
            },
          ],
        }).valueOrThrow()
      )
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
        }).valueOrThrow()
      )
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
                    RichTextNodeType.list,
                    RichTextNodeType.listitem,
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
      'root, paragraph, text, linebreak',
      'list, listitem',
      RichTextNodeType.entity,
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
        }).valueOrThrow()
      )
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
        }).valueOrThrow()
      )
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
        }).valueOrThrow()
      )
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
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
        }).valueOrThrow()
      )
    );

    expect(state).toMatchSnapshot();

    expect(getSchemaSpecificationUpdateFromEditorState(state)).toEqual({});
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

    expect(afterSaveState).toMatchSnapshot();
  });
});
