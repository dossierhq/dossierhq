import { describe, expect, test } from 'vitest';
import { expectErrorResult } from '../CoreTestUtils.js';
import { ErrorType } from '../ErrorResult.js';
import { AdminSchemaWithMigrations } from './AdminSchema.js';
import {
  FieldType,
  REQUIRED_RICH_TEXT_NODES,
  RichTextNodeType,
  type AdminSchemaSpecificationWithMigrations,
  type EntityFieldSpecification,
  type NumberFieldSpecification,
  type RichTextFieldSpecification,
  type StringFieldSpecification,
  type ValueItemFieldSpecification,
} from './SchemaSpecification.js';

describe('AdminSchemaWithMigrations.updateAndValidate()', () => {
  test('empty->empty->empty', () => {
    expect(
      new AdminSchemaWithMigrations({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [],
        valueTypes: [],
        patterns: [],
        indexes: [],
        migrations: [],
      })
        .updateAndValidate({})
        .valueOrThrow().spec,
    ).toEqual<AdminSchemaSpecificationWithMigrations>({
      schemaKind: 'admin',
      version: 1,
      entityTypes: [],
      valueTypes: [],
      patterns: [],
      indexes: [],
      migrations: [],
    });
  });

  test('use existing adminOnly, authKeyPattern value if not specified on entity type update', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          adminOnly: true,
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
    expect(result.spec.entityTypes[0].adminOnly).toBe(true);
    expect(result.spec.entityTypes[0].authKeyPattern).toBe('aPattern');
    expect(result.spec.entityTypes[0].nameField).toBe('title');
  });

  test('use existing adminOnly value if not specified on value type update', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
      valueTypes: [{ name: 'Foo', adminOnly: true, fields: [] }],
    })
      .valueOrThrow()
      .updateAndValidate({ valueTypes: [{ name: 'Foo', fields: [] }] })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
    expect(result.spec.valueTypes[0].adminOnly).toBe(true);
  });

  test('fields not updated are kept', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
      entityTypes: [
        { name: 'Foo', fields: [{ name: 'field', type: FieldType.Entity, entityTypes: ['Foo'] }] },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.Entity }] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    const entityFieldSpec = result.spec.entityTypes[0].fields[0] as EntityFieldSpecification;
    expect(entityFieldSpec.entityTypes).toEqual(['Foo']);
  });

  test('use existing integer value if not specified on Number field update', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
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

  test('use existing entityTypes, linkEntityTypes, valueTypes, richTextNodes values if not specified on RichText field update', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          fields: [
            {
              name: 'field',
              type: FieldType.RichText,
              entityTypes: ['Foo'],
              linkEntityTypes: ['Foo'],
              valueTypes: ['Bar'],
              richTextNodes: [
                ...REQUIRED_RICH_TEXT_NODES,
                RichTextNodeType.entity,
                RichTextNodeType.entityLink,
                RichTextNodeType.valueItem,
              ],
            },
          ],
        },
      ],
      valueTypes: [{ name: 'Bar', fields: [] }],
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
    expect(richTextFieldSpec.valueTypes).toEqual(['Bar']);
    expect(richTextFieldSpec.richTextNodes).toEqual([
      RichTextNodeType.entity,
      RichTextNodeType.entityLink,
      RichTextNodeType.linebreak,
      RichTextNodeType.paragraph,
      RichTextNodeType.root,
      RichTextNodeType.tab,
      RichTextNodeType.text,
      RichTextNodeType.valueItem,
    ]);
  });

  test('use existing valueTypes value if not specified on ValueItem field update', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
      entityTypes: [
        {
          name: 'Foo',
          fields: [
            {
              name: 'field',
              type: FieldType.ValueItem,
              valueTypes: ['Bar'],
            },
          ],
        },
      ],
      valueTypes: [{ name: 'Bar', fields: [] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.ValueItem }] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    const valueItemFieldSpec = result.spec.entityTypes[0].fields[0] as ValueItemFieldSpecification;
    expect(valueItemFieldSpec.valueTypes).toEqual(['Bar']);
  });

  test('empty->entity with pattern', () => {
    expect(
      new AdminSchemaWithMigrations({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [],
        valueTypes: [],
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
      entityTypes: [{ name: 'Foo', authKeyPattern: 'aPattern', fields: [] }],
      patterns: [{ name: 'aPattern', pattern: '^pattern$' }],
    })
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [{ name: 'Foo', adminOnly: false, authKeyPattern: null, fields: [] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.spec.patterns.length).toBe(0);
  });

  test('field with matchPattern', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({})
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
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
    const result = AdminSchemaWithMigrations.createAndValidate({})
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
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
    const result = AdminSchemaWithMigrations.createAndValidate({})
      .valueOrThrow()
      .updateAndValidate({
        entityTypes: [
          {
            name: 'Entity',
            adminOnly: false,
            fields: [
              { name: 'entity', type: FieldType.Entity, entityTypes: ['Entity', 'Entity'] },
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
                valueTypes: ['ValueType', 'ValueType'],
                richTextNodes: [
                  ...REQUIRED_RICH_TEXT_NODES,
                  RichTextNodeType.entity,
                  RichTextNodeType.entityLink,
                  RichTextNodeType.valueItem,
                ],
              },
              {
                name: 'valueItem',
                type: FieldType.ValueItem,
                valueTypes: ['ValueType', 'ValueType'],
              },
            ],
          },
        ],
        valueTypes: [{ name: 'ValueType', fields: [] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
  });

  test('Error: changing type of field', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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

describe('AdminSchemaWithMigrations.updateAndValidate() migrations', () => {
  test('empty actions is removed', () => {
    const schema = AdminSchemaWithMigrations.createAndValidate({
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
    const firstSchema = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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

describe('AdminSchemaWithMigrations.updateAndValidate() deleteField', () => {
  test('entity field (migration only)', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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

  test('value item field (migration only)', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
      valueTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          { version: 2, actions: [{ action: 'deleteField', valueType: 'Foo', field: 'field' }] },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    expect(result.spec.valueTypes[0].fields).toEqual([]);
  });

  test('Error: invalid type name', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({})
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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

describe('AdminSchemaWithMigrations.updateAndValidate() renameField', () => {
  test('entity field (migration only)', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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
              richTextNodes: [...REQUIRED_RICH_TEXT_NODES, 'entity', 'entityLink', 'valueItem'],
              valueTypes: ['ValueItem'],
            },
          ],
        },
      ],
      valueTypes: [{ name: 'ValueItem', fields: [] }],
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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

  test('value item field (migration only)', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
      valueTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameField', valueType: 'Foo', field: 'field', newName: 'newField' },
            ],
          },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    expect(result.spec.valueTypes[0].fields[0].name).toBe('newField');
  });

  test('Error: invalid type name', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({})
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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

describe('AdminSchemaWithMigrations.updateAndValidate() deleteType', () => {
  test('entity type', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
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
            { name: 'entity', type: FieldType.Entity, entityTypes: ['Bar', 'Foo'] },
            {
              name: 'richText',
              type: FieldType.RichText,
              entityTypes: ['Bar', 'Foo'],
              linkEntityTypes: ['Bar', 'Foo'],
            },
          ],
        },
      ],
      valueTypes: [
        {
          name: 'Baz',
          fields: [
            { name: 'entity', type: FieldType.Entity, entityTypes: ['Bar', 'Foo'] },
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
    const result = AdminSchemaWithMigrations.createAndValidate({
      entityTypes: [
        { name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] },
        {
          name: 'Bar',
          fields: [
            { name: 'entity', type: FieldType.Entity, entityTypes: ['Bar', 'Foo'] },
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
    expect((barTypeSpec.fields[0] as EntityFieldSpecification).entityTypes).toEqual(['Bar']); // Foo is removed since it referred to the old type
  });

  test('value type', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
      valueTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [{ version: 2, actions: [{ action: 'deleteType', valueType: 'Foo' }] }],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();

    expect(result.spec.valueTypes).toEqual([]);
  });

  test('value type referenced by other fields', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
      valueTypes: [
        { name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] },
        {
          name: 'Bar',
          fields: [
            { name: 'valueItem', type: FieldType.ValueItem, valueTypes: ['Bar', 'Foo'] },
            { name: 'richText', type: FieldType.RichText, valueTypes: ['Bar', 'Foo'] },
          ],
        },
      ],
      entityTypes: [
        {
          name: 'Baz',
          fields: [
            { name: 'valueItem', type: FieldType.ValueItem, valueTypes: ['Bar', 'Foo'] },
            { name: 'richText', type: FieldType.RichText, valueTypes: ['Bar', 'Foo'] },
          ],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [{ version: 2, actions: [{ action: 'deleteType', valueType: 'Foo' }] }],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
  });

  test('Error: invalid type name', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({})
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

describe('AdminSchemaWithMigrations.updateAndValidate() renameType', () => {
  test('entity type', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
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
    const result = AdminSchemaWithMigrations.createAndValidate({
      entityTypes: [
        { name: 'Foo', fields: [{ name: 'field', type: FieldType.Entity, entityTypes: ['Foo'] }] },
        {
          name: 'Bar',
          fields: [
            { name: 'entity', type: FieldType.Entity, entityTypes: ['Bar', 'Foo'] },
            {
              name: 'richText',
              type: FieldType.RichText,
              entityTypes: ['Bar', 'Foo'],
              linkEntityTypes: ['Bar', 'Foo'],
            },
          ],
        },
      ],
      valueTypes: [
        {
          name: 'Baz',
          fields: [
            { name: 'entity', type: FieldType.Entity, entityTypes: ['Bar', 'Foo'] },
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
    const result = AdminSchemaWithMigrations.createAndValidate({
      entityTypes: [
        { name: 'Foo', fields: [{ name: 'field', type: FieldType.Entity, entityTypes: ['Foo'] }] },
        {
          name: 'Bar',
          fields: [
            { name: 'entity', type: FieldType.Entity, entityTypes: ['Bar', 'Foo'] },
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

  test('value type', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
      valueTypes: [{ name: 'Foo', fields: [{ name: 'field', type: FieldType.String }] }],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          { version: 2, actions: [{ action: 'renameType', valueType: 'Foo', newName: 'Foo2' }] },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
  });

  test('value type referenced by other fields', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({
      valueTypes: [
        {
          name: 'Foo',
          fields: [{ name: 'field', type: FieldType.ValueItem, valueTypes: ['Foo'] }],
        },
        {
          name: 'Bar',
          fields: [
            { name: 'valueItem', type: FieldType.ValueItem, valueTypes: ['Bar', 'Foo'] },
            { name: 'richText', type: FieldType.RichText, valueTypes: ['Bar', 'Foo'] },
          ],
        },
      ],
      entityTypes: [
        {
          name: 'Baz',
          fields: [
            { name: 'valueItem', type: FieldType.ValueItem, valueTypes: ['Bar', 'Foo'] },
            { name: 'richText', type: FieldType.RichText, valueTypes: ['Bar', 'Foo'] },
          ],
        },
      ],
    })
      .valueOrThrow()
      .updateAndValidate({
        migrations: [
          { version: 2, actions: [{ action: 'renameType', valueType: 'Foo', newName: 'Foo2' }] },
        ],
      })
      .valueOrThrow();
    expect(result.spec).toMatchSnapshot();
  });

  test('Error: invalid type name', () => {
    const result = AdminSchemaWithMigrations.createAndValidate({})
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
