import { describe, expect, test } from 'vitest';
import { expectErrorResult, expectOkResult, expectResultValue } from './CoreTestUtils.js';
import { ErrorType } from './ErrorResult.js';
import { AdminSchema, FieldType, RichTextNodeType } from './Schema.js';

describe('mergeWith()', () => {
  test('empty->empty->empty', () => {
    expectResultValue(new AdminSchema({ entityTypes: [], valueTypes: [] }).mergeWith({}), {
      entityTypes: [],
      valueTypes: [],
    });
  });
});

describe('validate()', () => {
  test('Empty spec validates', () => {
    expectOkResult(new AdminSchema({ entityTypes: [], valueTypes: [] }).validate());
  });

  test('Limit value and entity types on rich text', () => {
    expectOkResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                valueTypes: ['Value'],
                entityTypes: ['Foo'],
              },
            ],
          },
        ],
        valueTypes: [
          {
            name: 'Value',
            adminOnly: false,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                valueTypes: ['Value'],
                entityTypes: ['Foo'],
              },
            ],
          },
        ],
      }).validate()
    );
  });

  test('Error: Invalid field type', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [{ name: 'bar', type: 'Invalid' as FieldType }],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Specified type Invalid doesn’t exist'
    );
  });

  test('Error: Duplicate entity type names', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          { name: 'Foo', adminOnly: false, fields: [] },
          { name: 'Foo', adminOnly: false, fields: [] },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo: Duplicate type name'
    );
  });

  test('Error: Duplicate entity and value type names', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
        valueTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
      }).validate(),
      ErrorType.BadRequest,
      'Foo: Duplicate type name'
    );
  });

  test('Error: Field named type on value type', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [],
        valueTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [{ name: 'type', type: FieldType.String }],
          },
        ],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.type: Invalid field name for a value type'
    );
  });

  test('Error: Boolean (i.e. non-String) with multiline', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [{ name: 'boolean', type: FieldType.Boolean, multiline: true }],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.boolean: Field with type Boolean shouldn’t specify multiline'
    );
  });

  test('Error: Reference to invalid entity type', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [{ name: 'bar', type: FieldType.EntityType, entityTypes: ['Invalid'] }],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced entity type in entityTypes Invalid doesn’t exist'
    );
  });

  test('Error: entityTypes specified on String field', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [{ name: 'bar', type: FieldType.String, entityTypes: ['Bar'] }],
          },
          { name: 'Bar', adminOnly: false, fields: [] },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Field with type String shouldn’t specify entityTypes'
    );
  });

  test('Error: Value type with invalid value type', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [{ name: 'bar', type: FieldType.ValueType, valueTypes: ['Invalid'] }],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Value type in valueTypes Invalid doesn’t exist'
    );
  });

  test('Error: valueTypes specified on String field', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [{ name: 'bar', type: FieldType.String, valueTypes: ['Bar'] }],
          },
          { name: 'Bar', adminOnly: false, fields: [] },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Field with type String shouldn’t specify valueTypes'
    );
  });

  test('Error: richTextNodes specified on String field', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [
              {
                name: 'bar',
                type: FieldType.String,
                richTextNodes: [RichTextNodeType.paragraph],
              },
            ],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Field with type String shouldn’t specify richTextNodes'
    );
  });

  test('Error: richTextNodes with duplicate type', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                richTextNodes: [RichTextNodeType.paragraph, RichTextNodeType.paragraph],
              },
            ],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextNodes with type paragraph is duplicated'
    );
  });

  test('Error: richTextNodes without root, paragraph and text', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                richTextNodes: [RichTextNodeType.entity],
              },
            ],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextNodes must include root, paragraph, text'
    );
  });

  test('Error: richTextNodes without paragraph', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                richTextNodes: [RichTextNodeType.root, RichTextNodeType.text],
              },
            ],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextNodes must include paragraph'
    );
  });

  test('Error: richTextNodes without text', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                richTextNodes: [RichTextNodeType.root, RichTextNodeType.paragraph],
              },
            ],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextNodes must include text'
    );
  });

  test('Error: entityTypes specified but not entity richTextNodes', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                entityTypes: ['Foo'],
                richTextNodes: [
                  RichTextNodeType.root,
                  RichTextNodeType.paragraph,
                  RichTextNodeType.text,
                ],
              },
            ],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: entityTypes is specified for field, but richTextNodes is missing entity'
    );
  });

  test('Error: valueTypes specified but not valueItem richTextNodes', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                valueTypes: ['Bar'],
                richTextNodes: [
                  RichTextNodeType.root,
                  RichTextNodeType.paragraph,
                  RichTextNodeType.text,
                ],
              },
            ],
          },
        ],
        valueTypes: [{ name: 'Bar', adminOnly: false, fields: [] }],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: valueTypes is specified for field, but richTextNodes is missing valueItem'
    );
  });

  test('Error: referencing adminOnly entity from non-adminOnly', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [
              {
                name: 'bar',
                type: FieldType.EntityType,
                entityTypes: ['Bar'],
              },
            ],
          },
          {
            name: 'Bar',
            adminOnly: true,
            fields: [],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced entity type in entityTypes (Bar) is adminOnly, but Foo isn’t'
    );
  });

  test('Error: referencing adminOnly value type from non-adminOnly', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [],
        valueTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [
              {
                name: 'bar',
                type: FieldType.ValueType,
                valueTypes: ['Bar'],
              },
            ],
          },
          {
            name: 'Bar',
            adminOnly: true,
            fields: [],
          },
        ],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced value type in valueTypes (Bar) is adminOnly, but Foo isn’t'
    );
  });
});

describe('AdminSchema.toPublishedSchema()', () => {
  test('empty->empty', () => {
    expect(new AdminSchema({ entityTypes: [], valueTypes: [] }).toPublishedSchema().spec).toEqual({
      entityTypes: [],
      valueTypes: [],
    });
  });

  test('1 entity type and 1 value type', () => {
    expect(
      new AdminSchema({
        entityTypes: [
          { name: 'Foo', adminOnly: false, fields: [{ name: 'field1', type: FieldType.String }] },
        ],
        valueTypes: [
          { name: 'Bar', adminOnly: false, fields: [{ name: 'field1', type: FieldType.Location }] },
        ],
      }).toPublishedSchema().spec
    ).toEqual({
      entityTypes: [{ name: 'Foo', fields: [{ name: 'field1', type: FieldType.String }] }],
      valueTypes: [{ name: 'Bar', fields: [{ name: 'field1', type: FieldType.Location }] }],
    });
  });

  test('1 adminOnly entity type and 1 adminOnly value type', () => {
    expect(
      new AdminSchema({
        entityTypes: [
          { name: 'Foo', adminOnly: true, fields: [{ name: 'field1', type: FieldType.String }] },
        ],
        valueTypes: [
          { name: 'Bar', adminOnly: true, fields: [{ name: 'field1', type: FieldType.Location }] },
        ],
      }).toPublishedSchema().spec
    ).toEqual({
      entityTypes: [],
      valueTypes: [],
    });
  });
});
