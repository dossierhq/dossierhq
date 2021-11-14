import { ErrorType, FieldType, RichTextBlockType, AdminSchema } from '.';
import { expectErrorResult, expectOkResult, expectResultValue } from './CoreTestUtils';

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

  test('Error: richTextBlocks specified on String field', () => {
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
                richTextBlocks: [{ type: RichTextBlockType.paragraph }],
              },
            ],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Field with type String shouldn’t specify richTextBlocks'
    );
  });

  test('Error: richTextBlocks with duplicate type', () => {
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
                richTextBlocks: [
                  { type: RichTextBlockType.paragraph },
                  { type: RichTextBlockType.paragraph },
                ],
              },
            ],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextBlocks with type paragraph is duplicated'
    );
  });

  test('Error: richTextBlocks without paragraph', () => {
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
                richTextBlocks: [{ type: RichTextBlockType.entity }],
              },
            ],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextBlocks must include paragraph'
    );
  });

  test('Error: richTextBlock for entity with inlineTypes', () => {
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
                richTextBlocks: [
                  { type: RichTextBlockType.paragraph },
                  { type: RichTextBlockType.entity, inlineTypes: ['bold'] },
                ],
              },
            ],
          },
        ],
        valueTypes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextBlocks with type entity shouldn’t specify inlineTypes'
    );
  });
});
