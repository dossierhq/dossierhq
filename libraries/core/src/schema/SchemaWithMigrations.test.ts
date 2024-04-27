import { describe, expect, test } from 'vitest';
import { ErrorType } from '../ErrorResult.js';
import { RichTextNodeType } from '../Types.js';
import { expectErrorResult } from '../test/CoreTestUtils.js';
import { SchemaWithMigrations } from './Schema.js';
import {
  FieldType,
  REQUIRED_RICH_TEXT_NODES,
  type SchemaSpecificationWithMigrations,
  type ComponentFieldSpecification,
  type NumberFieldSpecification,
  type ReferenceFieldSpecification,
  type RichTextFieldSpecification,
  type StringFieldSpecification,
} from './SchemaSpecification.js';

describe('SchemaWithMigrations.updateAndValidate()', () => {
  test('empty->empty->empty', () => {
    expect(
      new SchemaWithMigrations({
        schemaKind: 'full',
        version: 1,
        entityTypes: [],
        componentTypes: [],
        patterns: [],
        indexes: [],
        migrations: [],
      })
        .updateAndValidate({})
        .valueOrThrow().spec,
    ).toEqual<SchemaSpecificationWithMigrations>({
      schemaKind: 'full',
      version: 1,
      entityTypes: [],
      componentTypes: [],
      patterns: [],
      indexes: [],
      migrations: [],
    });
  });

  test('use existing adminOnly, authKeyPattern value if not specified on entity type update', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          publishable: false,
          authKeyPattern: 'aPattern',
          nameField: 'title',
          fields: [{ name: 'title', type: FieldType.String }],
        },
      ],
      patterns: [{ name: 'aPattern', pattern: '.*' }],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.spec.entityTypes[0].publishable).toBe(false);
    expect(result.spec.entityTypes[0].authKeyPattern).toBe('aPattern');
    expect(result.spec.entityTypes[0].nameField).toBe('title');
  });

  test('use existing adminOnly value if not specified on component type update', () => {
    const result = SchemaWithMigrations.createAndValidate({
      componentTypes: [{ name: 'Foo', adminOnly: true, fields: [] }],
    })
      .valueOrThrow()
      .updateAndValidate({ componentTypes: [{ name: 'Foo', fields: [] }] })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
    expect(result.spec.componentTypes[0].adminOnly).toBe(true);
  });

  test('fields not updated are kept', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          fields: [
            { name: 'string', type: FieldType.String },
            { name: 'boolean', type: FieldType.Boolean },
          ],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [
          {
            name: 'Foo',
            fields: [
              { name: 'string', type: FieldType.String, required: true },
              { name: 'number', type: FieldType.Number },
            ],
          },
        ],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
  });

  test('use existing list value if not specified on field update', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        { name: 'Foo', fields: [{ name: 'field', type: FieldType.String, list: true }] },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.spec.entityTypes[0].fields[0].list).toBe(true);
  });

  test('use existing required value if not specified on field update', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        { name: 'Foo', fields: [{ name: 'field', type: FieldType.Boolean, required: true }] },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.Boolean }] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.spec.entityTypes[0].fields[0].required).toBe(true);
  });

  test('use existing adminOnly value if not specified on field update', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        { name: 'Foo', fields: [{ name: 'field', type: FieldType.Boolean, adminOnly: true }] },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.Boolean }] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.spec.entityTypes[0].fields[0].adminOnly).toBe(true);
  });

  test('use existing index, multiline, matchPattern values if not specified on String field update', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          fields: [
            {
              name: 'field',
              type: FieldType.String,
              index: 'anIndex',
              multiline: true,
              matchPattern: 'aPattern',
            },
          ],
        },
      ],
      indexes: [{ name: 'anIndex', type: 'unique' }],
      patterns: [{ name: 'aPattern', pattern: '.*' }],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();

    const stringFieldSpec = result.spec.entityTypes[0].fields[0] as StringFieldSpecification;
    expect(stringFieldSpec.index).toBe('anIndex');
    expect(stringFieldSpec.multiline).toBe(true);
    expect(stringFieldSpec.matchPattern).toBe('aPattern');
  });

  test('change index', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        { name: 'Foo', fields: [{ name: 'field', type: FieldType.String, index: 'anIndex' }] },
      ],
      indexes: [{ name: 'anIndex', type: 'unique' }],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [
          {
            name: 'Foo',
            fields: [{ name: 'field', type: FieldType.String, index: 'anotherIndex' }],
          },
        ],
        indexes: [{ name: 'anotherIndex', type: 'unique' }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect((result.spec.entityTypes[0].fields[0] as StringFieldSpecification).index).toBe(
      'anotherIndex',
    );
  });

  test('use existing values value if not specified on String field update', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          fields: [{ name: 'field', type: FieldType.String, values: [{ value: 'hello' }] }],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    const stringFieldSpec = result.spec.entityTypes[0].fields[0] as StringFieldSpecification;
    expect(stringFieldSpec.values).toEqual([{ value: 'hello' }]);
  });

  test('use existing entityTypes value if not specified on Entity field update', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          fields: [{ name: 'field', type: FieldType.Reference, entityTypes: ['Foo'] }],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.Reference }] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    const entityFieldSpec = result.spec.entityTypes[0].fields[0] as ReferenceFieldSpecification;
    expect(entityFieldSpec.entityTypes).toEqual(['Foo']);
  });

  test('use existing integer value if not specified on Number field update', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        { name: 'Foo', fields: [{ name: 'field', type: FieldType.Number, integer: true }] },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.Number }] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    const numberFieldSpec = result.spec.entityTypes[0].fields[0] as NumberFieldSpecification;
    expect(numberFieldSpec.integer).toBe(true);
  });

  test('use existing entityTypes, linkEntityTypes, componentTypes, richTextNodes values if not specified on RichText field update', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          fields: [
            {
              name: 'field',
              type: FieldType.RichText,
              entityTypes: ['Foo'],
              linkEntityTypes: ['Foo'],
              componentTypes: ['Bar'],
              richTextNodes: [
                ...REQUIRED_RICH_TEXT_NODES,
                RichTextNodeType.component,
                RichTextNodeType.entity,
                RichTextNodeType.entityLink,
              ],
            },
          ],
        },
      ],
      componentTypes: [{ name: 'Bar', fields: [] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.RichText }] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    const richTextFieldSpec = result.spec.entityTypes[0].fields[0] as RichTextFieldSpecification;
    expect(richTextFieldSpec.entityTypes).toEqual(['Foo']);
    expect(richTextFieldSpec.linkEntityTypes).toEqual(['Foo']);
    expect(richTextFieldSpec.componentTypes).toEqual(['Bar']);
    expect(richTextFieldSpec.richTextNodes).toEqual([
      RichTextNodeType.component,
      RichTextNodeType.entity,
      RichTextNodeType.entityLink,
      RichTextNodeType.linebreak,
      RichTextNodeType.paragraph,
      RichTextNodeType.root,
      RichTextNodeType.tab,
      RichTextNodeType.text,
    ]);
  });

  test('use existing componentTypes value if not specified on Component field update', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          fields: [
            {
              name: 'field',
              type: FieldType.Component,
              componentTypes: ['Bar'],
            },
          ],
        },
      ],
      componentTypes: [{ name: 'Bar', fields: [] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.Component }] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    const componentFieldSpec = result.spec.entityTypes[0].fields[0] as ComponentFieldSpecification;
    expect(componentFieldSpec.componentTypes).toEqual(['Bar']);
  });

  test('empty->entity with pattern', () => {
    expect(
      new SchemaWithMigrations({
        schemaKind: 'full',
        version: 1,
        entityTypes: [],
        componentTypes: [],
        patterns: [],
        indexes: [],
        migrations: [],
      })
        .updateAndValidate({
          entityTypes: [{ name: 'Foo', authKeyPattern: 'aPattern', fields: [] }],
          patterns: [{ name: 'aPattern', pattern: '^hello$' }],
        })
        .valueOrThrow().spec,
    ).toMatchSnapshot();
  });

  test('update pattern', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', authKeyPattern: 'aPattern', fields: [] }],
      patterns: [{ name: 'aPattern', pattern: '^old-pattern$' }],
    })
      .valueOrThrow()
      .updateAndValidate({
        patterns: [{ name: 'aPattern', pattern: '^new-pattern$' }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.getPattern('aPattern')?.pattern).toBe('^new-pattern$');
    expect(result.getPatternRegExp('aPattern')?.source).toBe('^new-pattern$');
  });

  test('unused pattern is removed', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', authKeyPattern: 'aPattern', fields: [] }],
      patterns: [{ name: 'aPattern', pattern: '^pattern$' }],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', publishable: true, authKeyPattern: null, fields: [] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.spec.patterns.length).toBe(0);
  });

  test('field with matchPattern', () => {
    const result = SchemaWithMigrations.createAndValidate({})
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [
          {
            name: 'Foo',
            publishable: true,
            fields: [{ name: 'title', type: FieldType.String, matchPattern: 'aPattern' }],
          },
        ],
        patterns: [{ name: 'aPattern', pattern: '^pattern$' }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.getPattern('aPattern')?.pattern).toBe('^pattern$');
  });

  test('field with index', () => {
    const result = SchemaWithMigrations.createAndValidate({})
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [
          {
            name: 'Foo',
            publishable: true,
            fields: [{ name: 'title', type: FieldType.String, index: 'uniqueIndex' }],
          },
        ],
        indexes: [{ name: 'uniqueIndex', type: 'unique' }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.getIndex('uniqueIndex')).toEqual({ name: 'uniqueIndex', type: 'unique' });
  });

  test('duplicate values', () => {
    const result = SchemaWithMigrations.createAndValidate({})
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [
          {
            name: 'Entity',
            publishable: true,
            fields: [
              { name: 'entity', type: FieldType.Reference, entityTypes: ['Entity', 'Entity'] },
              {
                name: 'string',
                type: FieldType.String,
                values: [{ value: 'a' }, { value: 'b' }, { value: 'a' }],
              },
              {
                name: 'richText',
                type: FieldType.RichText,
                entityTypes: ['Entity', 'Entity'],
                linkEntityTypes: ['Entity', 'Entity'],
                componentTypes: ['ComponentType', 'ComponentType'],
                richTextNodes: [
                  ...REQUIRED_RICH_TEXT_NODES,
                  RichTextNodeType.entity,
                  RichTextNodeType.entityLink,
                  RichTextNodeType.component,
                ],
              },
              {
                name: 'component',
                type: FieldType.Component,
                componentTypes: ['ComponentType', 'ComponentType'],
              },
            ],
          },
        ],
        componentTypes: [{ name: 'ComponentType', fields: [] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
  });

  test('Error: changing type of field', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.Boolean }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
      });

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'Foo.field: Can’t change type of field. Requested String but is Boolean',
    );
  });

  test('Error: changing list of field', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        { name: 'Foo', fields: [{ name: 'field', type: FieldType.String, list: true }] },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [
          { name: 'Foo', fields: [{ name: 'field', type: FieldType.String, list: false }] },
        ],
      });

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'Foo.field: Can’t change the value of list. Requested false but is true',
    );
  });
});

describe('SchemaWithMigrations.updateAndValidate() migrations', () => {
  test('empty actions is removed', () => {
    const schema = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', fields: [{ name: 'one', type: FieldType.Boolean }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [{ version: 2, actions: [] }],
      })
      .valueOrThrow();

    expect(schema.spec.migrations).toEqual([]);
  });

  test('include migrations for older versions', () => {
    const firstSchema = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          fields: [
            { name: 'one', type: FieldType.Boolean },
            { name: 'two', type: FieldType.Boolean },
          ],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          { version: 2, actions: [{ action: 'deleteField', entityType: 'Foo', field: 'one' }] },
        ],
      })
      .valueOrThrow();

    const secondSchema = firstSchema
      .updateAndValidate({
        migrations: [
          ...firstSchema.spec.migrations,
          { version: 3, actions: [{ action: 'deleteField', entityType: 'Foo', field: 'two' }] },
        ],
      })
      .valueOrThrow();

    expect(secondSchema.spec).toMatchSnapshot();
    expect(secondSchema.spec.migrations).toEqual([
      { version: 3, actions: [{ action: 'deleteField', field: 'two', entityType: 'Foo' }] },
      { version: 2, actions: [{ action: 'deleteField', field: 'one', entityType: 'Foo' }] },
    ]);
  });

  test('Error: duplicate for version', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', fields: [] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          { version: 2, actions: [{ action: 'deleteField', entityType: 'Foo', field: 'field' }] },
          { version: 2, actions: [] },
        ],
      });

    expectErrorResult(result, ErrorType.BadRequest, 'Duplicate migrations for version 2');
  });

  test('Error: wrong version', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', fields: [] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          { version: 1, actions: [{ action: 'deleteField', entityType: 'Foo', field: 'field' }] },
        ],
      });

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'New migration 1 must be the same as the schema new version 2',
    );
  });

  test('Error: old version is different than existing migration', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.Boolean }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          { version: 2, actions: [{ action: 'deleteField', entityType: 'Foo', field: 'field' }] },
        ],
      })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          {
            version: 2,
            actions: [{ action: 'renameField', entityType: 'Foo', field: 'field', newName: 'new' }],
          },
        ],
      });

    expectErrorResult(result, ErrorType.BadRequest, 'Migration 2 is already defined');
  });
});

describe('SchemaWithMigrations.updateAndValidate() deleteField', () => {
  test('entity field (migration only)', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          { version: 2, actions: [{ action: 'deleteField', entityType: 'Foo', field: 'field' }] },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    expect(result.spec.entityTypes[0].fields).toEqual([]);
  });

  test('entity name field with another field', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          nameField: 'field',
          fields: [
            { name: 'field', type: FieldType.String },
            { name: 'anotherField', type: FieldType.String },
          ],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'anotherField', type: FieldType.String }] }],
        migrations: [
          { version: 2, actions: [{ action: 'deleteField', entityType: 'Foo', field: 'field' }] },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    expect(result.spec.entityTypes[0].nameField).toEqual(null);
    expect(result.spec.entityTypes[0].fields).toHaveLength(1);
    expect(result.spec.entityTypes[0].fields[0].name).toEqual('anotherField');
  });

  test('entity field, replace with other field of same name', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.Boolean }] }],
        migrations: [
          { version: 2, actions: [{ action: 'deleteField', entityType: 'Foo', field: 'field' }] },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    expect(result.spec.entityTypes[0].fields[0].type).toBe(FieldType.Boolean);
  });

  test('component field (migration only)', () => {
    const result = SchemaWithMigrations.createAndValidate({
      componentTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          {
            version: 2,
            actions: [{ action: 'deleteField', componentType: 'Foo', field: 'field' }],
          },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    expect(result.spec.componentTypes[0].fields).toEqual([]);
  });

  test('Error: invalid type name', () => {
    const result = SchemaWithMigrations.createAndValidate({})
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          { version: 1, actions: [{ action: 'deleteField', entityType: 'Foo', field: 'field' }] },
        ],
      });

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'Type for migration deleteField Foo.field does not exist',
    );
  });

  test('Error: invalid field name', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', fields: [] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          { version: 2, actions: [{ action: 'deleteField', entityType: 'Foo', field: 'field' }] },
        ],
      });

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'Field for migration deleteField Foo.field does not exist',
    );
  });
});

describe('SchemaWithMigrations.updateAndValidate() renameField', () => {
  test('entity field (migration only)', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameField', entityType: 'Foo', field: 'field', newName: 'newField' },
            ],
          },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    expect(result.spec.entityTypes[0].fields[0].name).toEqual('newField');
  });

  test('entity name field, modify validations', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          nameField: 'field',
          fields: [
            { name: 'field', type: FieldType.String },
            { name: 'anotherField', type: FieldType.String },
          ],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [
          {
            name: 'Foo',
            fields: [{ name: 'newField', type: FieldType.String, values: [{ value: 'one' }] }],
          },
        ],
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameField', entityType: 'Foo', field: 'field', newName: 'newField' },
            ],
          },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    expect(result.spec.entityTypes[0].nameField).toEqual('newField');
    expect(result.spec.entityTypes[0].fields).toHaveLength(2);
  });

  test('entity rich text field, many validations', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          fields: [
            {
              name: 'oldName',
              type: FieldType.RichText,
              list: true,
              required: true,
              adminOnly: true,
              entityTypes: ['Foo'],
              linkEntityTypes: ['Foo'],
              richTextNodes: [
                ...REQUIRED_RICH_TEXT_NODES,
                RichTextNodeType.component,
                RichTextNodeType.entity,
                RichTextNodeType.entityLink,
              ],
              componentTypes: ['Component'],
            },
          ],
        },
      ],
      componentTypes: [{ name: 'Component', fields: [] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'newName', type: FieldType.RichText }] }],
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameField', entityType: 'Foo', field: 'oldName', newName: 'newName' },
            ],
          },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
  });

  test('entity field with other fields', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          fields: [
            { name: 'one', type: FieldType.String, list: true },
            { name: 'two', type: FieldType.Number, integer: true },
            { name: 'three', type: FieldType.Boolean, list: true },
          ],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameField', entityType: 'Foo', field: 'two', newName: 'newName' },
            ],
          },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    expect(result.spec.entityTypes[0].fields[1].name).toEqual('newName');
  });

  test('component field (migration only)', () => {
    const result = SchemaWithMigrations.createAndValidate({
      componentTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameField', componentType: 'Foo', field: 'field', newName: 'newField' },
            ],
          },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    expect(result.spec.componentTypes[0].fields[0].name).toBe('newField');
  });

  test('Error: invalid type name', () => {
    const result = SchemaWithMigrations.createAndValidate({})
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          {
            version: 1,
            actions: [
              { action: 'renameField', entityType: 'Foo', field: 'field', newName: 'newField' },
            ],
          },
        ],
      });

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'Type for migration renameField Foo.field does not exist',
    );
  });

  test('Error: invalid field name', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', fields: [] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameField', entityType: 'Foo', field: 'field', newName: 'newField' },
            ],
          },
        ],
      });

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'Field for migration renameField Foo.field does not exist',
    );
  });
});

describe('SchemaWithMigrations.updateAndValidate() deleteType', () => {
  test('entity type', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [{ version: 2, actions: [{ action: 'deleteType', entityType: 'Foo' }] }],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    expect(result.spec.entityTypes).toEqual([]);
  });

  test('entity type referenced by other fields', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          nameField: 'field',
          fields: [
            { name: 'field', type: FieldType.String },
            { name: 'anotherField', type: FieldType.String },
          ],
        },
        {
          name: 'Bar',
          fields: [
            { name: 'entity', type: FieldType.Reference, entityTypes: ['Bar', 'Foo'] },
            {
              name: 'richText',
              type: FieldType.RichText,
              entityTypes: ['Bar', 'Foo'],
              linkEntityTypes: ['Bar', 'Foo'],
            },
          ],
        },
      ],
      componentTypes: [
        {
          name: 'Baz',
          fields: [
            { name: 'entity', type: FieldType.Reference, entityTypes: ['Bar', 'Foo'] },
            {
              name: 'richText',
              type: FieldType.RichText,
              entityTypes: ['Bar', 'Foo'],
              linkEntityTypes: ['Bar', 'Foo'],
            },
          ],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [{ version: 2, actions: [{ action: 'deleteType', entityType: 'Foo' }] }],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
  });

  test('entity type, replace with other entity type with same name', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        { name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] },
        {
          name: 'Bar',
          fields: [
            { name: 'entity', type: FieldType.Reference, entityTypes: ['Bar', 'Foo'] },
            {
              name: 'richText',
              type: FieldType.RichText,
              entityTypes: ['Bar', 'Foo'],
              linkEntityTypes: ['Bar', 'Foo'],
            },
          ],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.Boolean }] }],
        migrations: [{ version: 2, actions: [{ action: 'deleteType', entityType: 'Foo' }] }],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    const fooTypeSpec = result.spec.entityTypes.find((it) => it.name === 'Foo')!;
    expect(fooTypeSpec.fields[0].type).toBe(FieldType.Boolean);
    const barTypeSpec = result.spec.entityTypes.find((it) => it.name === 'Bar')!;
    expect((barTypeSpec.fields[0] as ReferenceFieldSpecification).entityTypes).toEqual(['Bar']); // Foo is removed since it referred to the old type
  });

  test('component type', () => {
    const result = SchemaWithMigrations.createAndValidate({
      componentTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [{ version: 2, actions: [{ action: 'deleteType', componentType: 'Foo' }] }],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    expect(result.spec.componentTypes).toEqual([]);
  });

  test('component type referenced by other fields', () => {
    const result = SchemaWithMigrations.createAndValidate({
      componentTypes: [
        { name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] },
        {
          name: 'Bar',
          fields: [
            { name: 'component', type: FieldType.Component, componentTypes: ['Bar', 'Foo'] },
            { name: 'richText', type: FieldType.RichText, componentTypes: ['Bar', 'Foo'] },
          ],
        },
      ],
      entityTypes: [
        {
          name: 'Baz',
          fields: [
            { name: 'component', type: FieldType.Component, componentTypes: ['Bar', 'Foo'] },
            { name: 'richText', type: FieldType.RichText, componentTypes: ['Bar', 'Foo'] },
          ],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [{ version: 2, actions: [{ action: 'deleteType', componentType: 'Foo' }] }],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
  });

  test('Error: invalid type name', () => {
    const result = SchemaWithMigrations.createAndValidate({})
      .valueOrThrow()
      .updateAndValidate({
        migrations: [{ version: 1, actions: [{ action: 'deleteType', entityType: 'Foo' }] }],
      });

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'Type for migration deleteType Foo does not exist',
    );
  });
});

describe('SchemaWithMigrations.updateAndValidate() renameType', () => {
  test('entity type', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          { version: 2, actions: [{ action: 'renameType', entityType: 'Foo', newName: 'Foo2' }] },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
  });

  test('entity type referenced by other fields', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          fields: [{ name: 'field', type: FieldType.Reference, entityTypes: ['Foo'] }],
        },
        {
          name: 'Bar',
          fields: [
            { name: 'entity', type: FieldType.Reference, entityTypes: ['Bar', 'Foo'] },
            {
              name: 'richText',
              type: FieldType.RichText,
              entityTypes: ['Bar', 'Foo'],
              linkEntityTypes: ['Bar', 'Foo'],
            },
          ],
        },
      ],
      componentTypes: [
        {
          name: 'Baz',
          fields: [
            { name: 'entity', type: FieldType.Reference, entityTypes: ['Bar', 'Foo'] },
            {
              name: 'richText',
              type: FieldType.RichText,
              entityTypes: ['Bar', 'Foo'],
              linkEntityTypes: ['Bar', 'Foo'],
            },
          ],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          { version: 2, actions: [{ action: 'renameType', entityType: 'Foo', newName: 'Foo2' }] },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
  });

  test('entity type, add other entity type with same name', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          fields: [{ name: 'field', type: FieldType.Reference, entityTypes: ['Foo'] }],
        },
        {
          name: 'Bar',
          fields: [
            { name: 'entity', type: FieldType.Reference, entityTypes: ['Bar', 'Foo'] },
            {
              name: 'richText',
              type: FieldType.RichText,
              entityTypes: ['Bar', 'Foo'],
              linkEntityTypes: ['Bar', 'Foo'],
            },
          ],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.Boolean }] }],
        migrations: [
          { version: 2, actions: [{ action: 'renameType', entityType: 'Foo', newName: 'Foo2' }] },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    const fooTypeSpec = result.spec.entityTypes.find((it) => it.name === 'Foo')!;
    expect(fooTypeSpec.fields[0].type).toBe(FieldType.Boolean);
  });

  test('component type', () => {
    const result = SchemaWithMigrations.createAndValidate({
      componentTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          {
            version: 2,
            actions: [{ action: 'renameType', componentType: 'Foo', newName: 'Foo2' }],
          },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
  });

  test('component type referenced by other fields', () => {
    const result = SchemaWithMigrations.createAndValidate({
      componentTypes: [
        {
          name: 'Foo',
          fields: [{ name: 'field', type: FieldType.Component, componentTypes: ['Foo'] }],
        },
        {
          name: 'Bar',
          fields: [
            { name: 'component', type: FieldType.Component, componentTypes: ['Bar', 'Foo'] },
            { name: 'richText', type: FieldType.RichText, componentTypes: ['Bar', 'Foo'] },
          ],
        },
      ],
      entityTypes: [
        {
          name: 'Baz',
          fields: [
            { name: 'component', type: FieldType.Component, componentTypes: ['Bar', 'Foo'] },
            { name: 'richText', type: FieldType.RichText, componentTypes: ['Bar', 'Foo'] },
          ],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          {
            version: 2,
            actions: [{ action: 'renameType', componentType: 'Foo', newName: 'Foo2' }],
          },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
  });

  test('Error: invalid type name', () => {
    const result = SchemaWithMigrations.createAndValidate({})
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          { version: 1, actions: [{ action: 'renameType', entityType: 'Foo', newName: 'Foo2' }] },
        ],
      });

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'Type for migration renameType Foo does not exist',
    );
  });
});

describe('SchemaWithMigrations.updateAndValidate() transientMigrations', () => {
  test('error: specified without version', () => {
    const result = SchemaWithMigrations.createAndValidate({})
      .valueOrThrow()
      .updateAndValidate({
        transientMigrations: [{ action: 'renameIndex', index: 'anIndex', newName: 'newName' }],
      });

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'Schema version is required when specifying transient migrations',
    );
  });
});

describe('SchemaWithMigrations.updateAndValidate() deleteIndex', () => {
  test('unique index', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'EntityType',
          fields: [{ name: 'field', type: FieldType.String, index: 'anIndex' }],
        },
      ],
      componentTypes: [
        {
          name: 'ComponentType',
          fields: [{ name: 'field', type: FieldType.String, index: 'anIndex' }],
        },
      ],
      indexes: [{ name: 'anIndex', type: 'unique' }],
    })
      .valueOrThrow()
      .updateAndValidate({
        version: 2,
        transientMigrations: [{ action: 'deleteIndex', index: 'anIndex' }],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    expect(result.spec.indexes).toEqual([]);
  });

  test('unique index, replace with other index with same name', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'EntityType',
          fields: [{ name: 'field', type: FieldType.String, index: 'anIndex' }],
        },
      ],
      componentTypes: [
        {
          name: 'ComponentType',
          fields: [{ name: 'field', type: FieldType.String, index: 'anIndex' }],
        },
      ],
      indexes: [{ name: 'anIndex', type: 'unique' }],
    })
      .valueOrThrow()
      .updateAndValidate({
        version: 2,
        entityTypes: [
          {
            name: 'EntityType',
            fields: [{ name: 'anotherField', type: FieldType.String, index: 'anIndex' }],
          },
        ],
        indexes: [{ name: 'anIndex', type: 'unique' }],
        transientMigrations: [{ action: 'deleteIndex', index: 'anIndex' }],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
  });

  test('Error: invalid type name', () => {
    const result = SchemaWithMigrations.createAndValidate({})
      .valueOrThrow()
      .updateAndValidate({
        version: 2,
        transientMigrations: [{ action: 'deleteIndex', index: 'anInvalidIndex' }],
      });

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'Index for migration deleteIndex anInvalidIndex does not exist',
    );
  });
});

describe('SchemaWithMigrations.updateAndValidate() renameIndex', () => {
  test('unique index', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'EntityType',
          fields: [{ name: 'field', type: FieldType.String, index: 'oldIndex' }],
        },
      ],
      componentTypes: [
        {
          name: 'ComponentType',
          fields: [{ name: 'field', type: FieldType.String, index: 'oldIndex' }],
        },
      ],
      indexes: [{ name: 'oldIndex', type: 'unique' }],
    })
      .valueOrThrow()
      .updateAndValidate({
        version: 2,
        transientMigrations: [{ action: 'renameIndex', index: 'oldIndex', newName: 'newIndex' }],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
  });

  test('unique index and add to another field', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'EntityType',
          fields: [{ name: 'field', type: FieldType.String, index: 'oldIndex' }],
        },
      ],
      componentTypes: [
        {
          name: 'ComponentType',
          fields: [{ name: 'field', type: FieldType.String, index: 'oldIndex' }],
        },
      ],
      indexes: [{ name: 'oldIndex', type: 'unique' }],
    })
      .valueOrThrow()
      .updateAndValidate({
        version: 2,
        entityTypes: [
          {
            name: 'EntityType',
            fields: [{ name: 'anotherField', type: FieldType.String, index: 'newIndex' }],
          },
        ],
        transientMigrations: [{ action: 'renameIndex', index: 'oldIndex', newName: 'newIndex' }],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
  });

  test('unique index, add other index with same name', () => {
    const result = SchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'OneEntity',
          fields: [{ name: 'fieldA', type: FieldType.String, index: 'oldIndex' }],
        },
      ],
      indexes: [{ name: 'oldIndex', type: 'unique' }],
    })
      .valueOrThrow()
      .updateAndValidate({
        version: 2,
        entityTypes: [
          {
            name: 'OneEntity',
            fields: [{ name: 'fieldB', type: FieldType.String, index: 'oldIndex' }],
          },
        ],
        indexes: [{ name: 'oldIndex', type: 'unique' }],
        transientMigrations: [{ action: 'renameIndex', index: 'oldIndex', newName: 'newIndex' }],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
  });

  test('Error: invalid index name', () => {
    const result = SchemaWithMigrations.createAndValidate({})
      .valueOrThrow()
      .updateAndValidate({
        version: 2,
        transientMigrations: [{ action: 'renameIndex', index: 'invalid', newName: 'invalid2' }],
      });

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'Index for migration renameIndex invalid does not exist',
    );
  });
});
