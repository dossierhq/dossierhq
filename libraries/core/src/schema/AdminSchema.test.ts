import { describe, expect, test } from 'vitest';
import { expectErrorResult, expectOkResult } from '../CoreTestUtils.js';
import { ErrorType } from '../ErrorResult.js';
import { AdminSchema } from './AdminSchema.js';
import {
  FieldType,
  REQUIRED_RICH_TEXT_NODES,
  RichTextNodeType,
  type AdminFieldSpecification,
  type BooleanFieldSpecification,
  type PublishedSchemaSpecification,
} from './SchemaSpecification.js';

describe('AdminSchema.validate()', () => {
  test('Empty spec validates', () => {
    expectOkResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
    );
  });

  test('Limit value and entity types on rich text', () => {
    expectOkResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                adminOnly: false,
                required: false,
                valueTypes: ['Value'],
                entityTypes: ['Foo'],
                linkEntityTypes: ['Foo'],
                richTextNodes: [],
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
                list: false,
                adminOnly: false,
                required: false,
                valueTypes: ['Value'],
                entityTypes: ['Foo'],
                linkEntityTypes: [],
                richTextNodes: [],
              },
            ],
          },
        ],
        patterns: [],
        indexes: [],
      }).validate(),
    );
  });

  test('Entity field referencing an adminOnly entity type from an adminOnly field', () => {
    expectOkResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.Entity,
                list: false,
                adminOnly: true,
                required: false,
                entityTypes: ['AdminOnly'],
              },
            ],
          },
          {
            name: 'AdminOnly',
            adminOnly: true,
            authKeyPattern: null,
            nameField: null,
            fields: [],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
    );
  });

  test('Error: Invalid field type', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: 'Invalid' as typeof FieldType.Boolean,
                list: false,
                adminOnly: false,
                required: false,
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Specified type Invalid doesn’t exist',
    );
  });

  test('Error: Invalid entity type name', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          { name: 'foo', adminOnly: false, authKeyPattern: null, nameField: null, fields: [] },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'foo: The type name has to start with an upper-case letter (A-Z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as MyType_123',
    );
  });

  test('Error: Invalid value type name', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [],
        valueTypes: [{ name: 'foo', adminOnly: false, fields: [] }],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'foo: The type name has to start with an upper-case letter (A-Z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as MyType_123',
    );
  });

  test('Error: Duplicate entity type names', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          { name: 'Foo', adminOnly: false, authKeyPattern: null, nameField: null, fields: [] },
          { name: 'Foo', adminOnly: false, authKeyPattern: null, nameField: null, fields: [] },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo: Duplicate type name',
    );
  });

  test('Error: Duplicate entity and value type names', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          { name: 'Foo', adminOnly: false, authKeyPattern: null, nameField: null, fields: [] },
        ],
        valueTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo: Duplicate type name',
    );
  });

  test('Error: nameField with missing field', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: 'missing',
            fields: [],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo: Found no field matching nameField (missing)',
    );
  });

  test('Error: nameField to non-single string field', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: 'booleanField',
            fields: [
              {
                name: 'booleanField',
                type: FieldType.Boolean,
                list: false,
                adminOnly: false,
                required: false,
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo: nameField (booleanField) should be a string (non-list)',
    );
  });

  test('Error: Invalid field name', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [],
        valueTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [
              {
                name: 'NotCamelCase',
                type: FieldType.String,
                list: false,
                multiline: false,
                adminOnly: false,
                required: false,
                matchPattern: null,
                values: [],
                index: null,
              },
            ],
          },
        ],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.NotCamelCase: The field name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myField_123',
    );
  });

  test('Error: Field named type on value type', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [],
        valueTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [
              {
                name: 'type',
                type: FieldType.String,
                list: false,
                multiline: false,
                adminOnly: false,
                required: false,
                matchPattern: null,
                values: [],
                index: null,
              },
            ],
          },
        ],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.type: Invalid field name for a value type',
    );
  });

  test('Error: Duplicate field names', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            nameField: null,
            authKeyPattern: null,
            fields: [
              {
                name: 'field',
                type: FieldType.Number,
                adminOnly: false,
                list: false,
                required: false,
                integer: true,
              },
              {
                name: 'field',
                type: FieldType.Boolean,
                adminOnly: false,
                list: false,
                required: false,
              },
            ],
          },
        ],
        valueTypes: [],
        indexes: [],
        patterns: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.field: Duplicate field name',
    );
  });

  test('Error: Boolean (i.e. non-String) with multiline', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'boolean',
                type: FieldType.Boolean,
                list: false,
                adminOnly: false,
                required: false,
                multiline: true,
              } as AdminFieldSpecification<BooleanFieldSpecification>,
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.boolean: Field with type Boolean shouldn’t specify multiline',
    );
  });

  test('Error: Reference to invalid entity type', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.Entity,
                list: false,
                required: false,
                adminOnly: false,
                entityTypes: ['Invalid'],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced entity type in entityTypes Invalid doesn’t exist',
    );
  });

  test('Error: Reference to invalid entity type in linkEntityTypes', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                required: false,
                adminOnly: false,
                entityTypes: [],
                linkEntityTypes: ['Invalid'],
                valueTypes: [],
                richTextNodes: [],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced entity type in linkEntityTypes Invalid doesn’t exist',
    );
  });

  test('Error: entityTypes specified on Boolean field', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.Boolean,
                list: false,
                required: false,
                adminOnly: false,
                entityTypes: ['Bar'],
              } as AdminFieldSpecification<BooleanFieldSpecification>,
            ],
          },
          { name: 'Bar', adminOnly: false, authKeyPattern: null, nameField: null, fields: [] },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Field with type Boolean shouldn’t specify entityTypes',
    );
  });

  test('Error: Value type with invalid value type', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.ValueItem,
                list: false,
                required: false,
                adminOnly: false,
                valueTypes: ['Invalid'],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Value type in valueTypes Invalid doesn’t exist',
    );
  });

  test('Error: linkEntityTypes specified on Boolean field', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.Boolean,
                list: false,
                required: false,
                adminOnly: false,
                linkEntityTypes: ['Bar'],
              } as AdminFieldSpecification<BooleanFieldSpecification>,
            ],
          },
          { name: 'Bar', adminOnly: false, authKeyPattern: null, nameField: null, fields: [] },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Field with type Boolean shouldn’t specify linkEntityTypes',
    );
  });

  test('Error: valueTypes specified on Boolean field', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.Boolean,
                list: false,
                required: false,
                adminOnly: false,
                valueTypes: ['Bar'],
              } as AdminFieldSpecification<BooleanFieldSpecification>,
            ],
          },
          { name: 'Bar', adminOnly: false, authKeyPattern: null, nameField: null, fields: [] },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Field with type Boolean shouldn’t specify valueTypes',
    );
  });

  test('Error: richTextNodes specified on Boolean field', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.Boolean,
                list: false,
                required: false,
                adminOnly: false,
                richTextNodes: [RichTextNodeType.paragraph],
              } as AdminFieldSpecification<BooleanFieldSpecification>,
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Field with type Boolean shouldn’t specify richTextNodes',
    );
  });

  test('Error: richTextNodes with duplicate type', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                required: false,
                adminOnly: false,
                richTextNodes: [RichTextNodeType.paragraph, RichTextNodeType.paragraph],
                entityTypes: [],
                linkEntityTypes: [],
                valueTypes: [],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextNodes with type paragraph is duplicated',
    );
  });

  test('Error: richTextNodes without required nodes', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                required: false,
                adminOnly: false,
                richTextNodes: [RichTextNodeType.entity],
                entityTypes: [],
                linkEntityTypes: [],
                valueTypes: [],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextNodes must include root, paragraph, text, linebreak, tab',
    );
  });

  test('Error: richTextNodes without paragraph', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                required: false,
                adminOnly: false,
                richTextNodes: REQUIRED_RICH_TEXT_NODES.filter(
                  (it) => it !== RichTextNodeType.paragraph,
                ),
                entityTypes: [],
                linkEntityTypes: [],
                valueTypes: [],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextNodes must include paragraph',
    );
  });

  test('Error: richTextNodes without text', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                required: false,
                adminOnly: false,
                richTextNodes: REQUIRED_RICH_TEXT_NODES.filter(
                  (it) => it !== RichTextNodeType.text,
                ),
                entityTypes: [],
                linkEntityTypes: [],
                valueTypes: [],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextNodes must include text',
    );
  });

  test('Error: richTextNodes without linebreak', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                required: false,
                adminOnly: false,
                richTextNodes: REQUIRED_RICH_TEXT_NODES.filter(
                  (it) => it !== RichTextNodeType.linebreak,
                ),
                entityTypes: [],
                linkEntityTypes: [],
                valueTypes: [],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextNodes must include linebreak',
    );
  });

  test('Error: richTextNodes without tab', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                required: false,
                adminOnly: false,
                richTextNodes: REQUIRED_RICH_TEXT_NODES.filter((it) => it !== RichTextNodeType.tab),
                entityTypes: [],
                linkEntityTypes: [],
                valueTypes: [],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextNodes must include tab',
    );
  });

  test('Error: richTextNodes with list without listitem', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                required: false,
                adminOnly: false,
                richTextNodes: [...REQUIRED_RICH_TEXT_NODES, RichTextNodeType.list],
                entityTypes: [],
                linkEntityTypes: [],
                valueTypes: [],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextNodes includes list but must also include related listitem',
    );
  });

  test('Error: richTextNodes with listitem without list', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                required: false,
                adminOnly: false,
                richTextNodes: [...REQUIRED_RICH_TEXT_NODES, RichTextNodeType.listitem],
                entityTypes: [],
                linkEntityTypes: [],
                valueTypes: [],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextNodes includes listitem but must also include related list',
    );
  });

  test('Error: richTextNodes with code without code-highlight', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                required: false,
                adminOnly: false,
                richTextNodes: [...REQUIRED_RICH_TEXT_NODES, RichTextNodeType.code],
                entityTypes: [],
                linkEntityTypes: [],
                valueTypes: [],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextNodes includes code but must also include related code-highlight',
    );
  });

  test('Error: richTextNodes with code-highlight without code', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                required: false,
                adminOnly: false,
                richTextNodes: [...REQUIRED_RICH_TEXT_NODES, RichTextNodeType['code-highlight']],
                entityTypes: [],
                linkEntityTypes: [],
                valueTypes: [],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: richTextNodes includes code-highlight but must also include related code',
    );
  });

  test('Error: entityTypes specified but not entity richTextNodes', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                required: false,
                adminOnly: false,
                entityTypes: ['Foo'],
                richTextNodes: REQUIRED_RICH_TEXT_NODES,
                linkEntityTypes: [],
                valueTypes: [],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: entityTypes is specified for field, but richTextNodes is missing entity',
    );
  });

  test('Error: linkEntityTypes specified but not entityLink richTextNodes', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                linkEntityTypes: ['Foo'],
                list: false,
                required: false,
                adminOnly: false,
                richTextNodes: REQUIRED_RICH_TEXT_NODES,
                entityTypes: [],
                valueTypes: [],
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: linkEntityTypes is specified for field, but richTextNodes is missing entityLink',
    );
  });

  test('Error: valueTypes specified but not valueItem richTextNodes', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                required: false,
                adminOnly: false,
                entityTypes: [],
                linkEntityTypes: [],
                valueTypes: ['Bar'],
                richTextNodes: REQUIRED_RICH_TEXT_NODES,
              },
            ],
          },
        ],
        valueTypes: [{ name: 'Bar', adminOnly: false, fields: [] }],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: valueTypes is specified for field, but richTextNodes is missing valueItem',
    );
  });

  test('Error: referencing adminOnly entity from non-adminOnly', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.Entity,
                list: false,
                required: false,
                adminOnly: false,
                entityTypes: ['Bar'],
              },
            ],
          },
          {
            name: 'Bar',
            adminOnly: true,
            authKeyPattern: null,
            nameField: null,
            fields: [],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced entity type in entityTypes (Bar) is adminOnly, but neither Foo nor bar are adminOnly',
    );
  });

  test('Error: referencing adminOnly link entity from non-adminOnly', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                list: false,
                required: false,
                adminOnly: false,
                entityTypes: [],
                valueTypes: [],
                linkEntityTypes: ['Bar'],
                richTextNodes: [],
              },
            ],
          },
          {
            name: 'Bar',
            adminOnly: true,
            authKeyPattern: null,
            nameField: null,
            fields: [],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced entity type in linkEntityTypes (Bar) is adminOnly, but neither Foo nor bar are adminOnly',
    );
  });

  test('Error: referencing adminOnly value type from non-adminOnly', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [],
        valueTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [
              {
                name: 'bar',
                type: FieldType.ValueItem,
                list: false,
                required: false,
                adminOnly: false,
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
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced value type in valueTypes (Bar) is adminOnly, but neither Foo nor bar are adminOnly',
    );
  });

  test('Error: Boolean (i.e. non-String) with matchPattern', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'boolean',
                type: FieldType.Boolean,
                list: false,
                required: false,
                adminOnly: false,
                matchPattern: 'foo',
              } as AdminFieldSpecification<BooleanFieldSpecification>,
            ],
          },
        ],
        valueTypes: [],
        patterns: [{ name: 'foo', pattern: '^foo$' }],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.boolean: Field with type Boolean shouldn’t specify matchPattern',
    );
  });

  test('Error: matchPattern with missing pattern name', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'string',
                type: FieldType.String,
                list: false,
                required: false,
                multiline: false,
                adminOnly: false,
                index: null,
                values: [],
                matchPattern: 'foo',
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.string: Unknown matchPattern (foo)',
    );
  });

  test('Error: duplicate pattern', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [],
        valueTypes: [],
        patterns: [
          { name: 'aPattern', pattern: '^a-pattern$' },
          { name: 'aPattern', pattern: '^duplicate$' },
        ],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'aPattern: Duplicate pattern name',
    );
  });

  test('Error: invalid pattern name', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [],
        valueTypes: [],
        patterns: [{ name: 'a-pattern', pattern: '^a-pattern$' }],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'a-pattern: The pattern name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myPattern_123',
    );
  });

  test('Error: entity authKey using missing pattern', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          { name: 'Foo', adminOnly: false, authKeyPattern: 'missing', nameField: null, fields: [] },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo: Unknown authKeyPattern (missing)',
    );
  });

  test('Error: invalid pattern', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [],
        valueTypes: [],
        patterns: [{ name: 'aPattern', pattern: 'invalid\\' }],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'aPattern: Invalid regex',
    );
  });

  test('Error: Boolean (i.e. non-String) with values', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'boolean',
                type: FieldType.Boolean,
                list: false,
                required: false,
                adminOnly: false,
                values: [{ value: 'foo' }],
              } as AdminFieldSpecification<BooleanFieldSpecification>,
            ],
          },
        ],
        valueTypes: [],
        patterns: [{ name: 'foo', pattern: '^foo$' }],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.boolean: Field with type Boolean shouldn’t specify values',
    );
  });

  test('Error: both matchPattern and values on same field', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'string',
                type: FieldType.String,
                list: false,
                required: false,
                multiline: false,
                index: null,
                adminOnly: false,
                values: [{ value: 'foo' }],
                matchPattern: 'foo',
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [{ name: 'foo', pattern: '^foo$' }],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.string: Can’t specify both matchPattern and values',
    );
  });

  test('Error: Boolean (i.e. non-String) with index', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'boolean',
                type: FieldType.Boolean,
                list: false,
                required: false,
                adminOnly: false,
                index: 'anIndex',
              } as AdminFieldSpecification<BooleanFieldSpecification>,
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [{ name: 'anIndex', type: 'unique' }],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.boolean: Field with type Boolean shouldn’t specify index',
    );
  });

  test('Error: index with missing index name', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            nameField: null,
            fields: [
              {
                name: 'string',
                type: FieldType.String,
                list: false,
                required: false,
                multiline: false,
                adminOnly: false,
                matchPattern: null,
                values: [],
                index: 'foo',
              },
            ],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.string: Unknown index (foo)',
    );
  });

  test('Error: duplicate index', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [],
        valueTypes: [],
        patterns: [],
        indexes: [
          { name: 'anIndex', type: 'unique' },
          { name: 'anIndex', type: 'unique' },
        ],
      }).validate(),
      ErrorType.BadRequest,
      'anIndex: Duplicate index name',
    );
  });

  test('Error: non-camelCase index', () => {
    expectErrorResult(
      new AdminSchema({
        schemaKind: 'admin',
        version: 1,
        entityTypes: [],
        valueTypes: [],
        patterns: [],
        indexes: [{ name: 'an-index', type: 'unique' }],
      }).validate(),
      ErrorType.BadRequest,
      'an-index: The index name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myIndex_123',
    );
  });
});

describe('AdminSchema.toPublishedSchema()', () => {
  test('empty->empty', () => {
    expect(
      AdminSchema.createAndValidate({}).valueOrThrow().toPublishedSchema().spec,
    ).toEqual<PublishedSchemaSpecification>({
      schemaKind: 'published',
      version: 0,
      entityTypes: [],
      valueTypes: [],
      patterns: [],
      indexes: [],
    });
  });

  test('1 entity type and 1 value type', () => {
    expect(
      AdminSchema.createAndValidate({
        entityTypes: [
          {
            name: 'Foo',
            fields: [{ name: 'field1', type: FieldType.String }],
          },
        ],
        valueTypes: [{ name: 'Bar', fields: [{ name: 'field1', type: FieldType.Location }] }],
      })
        .valueOrThrow()
        .toPublishedSchema().spec,
    ).toEqual<PublishedSchemaSpecification>({
      schemaKind: 'published',
      version: 1,
      entityTypes: [
        {
          name: 'Foo',
          authKeyPattern: null,
          fields: [
            {
              name: 'field1',
              type: FieldType.String,
              list: false,
              required: false,
              multiline: false,
              index: null,
              matchPattern: null,
              values: [],
            },
          ],
        },
      ],
      valueTypes: [
        {
          name: 'Bar',
          fields: [{ name: 'field1', type: FieldType.Location, list: false, required: false }],
        },
      ],
      patterns: [],
      indexes: [],
    });
  });

  test('1 entity type with pattern used by matchPattern', () => {
    expect(
      AdminSchema.createAndValidate({
        entityTypes: [
          {
            name: 'Foo',
            fields: [{ name: 'field1', type: FieldType.String, matchPattern: 'aPattern' }],
          },
        ],
        patterns: [{ name: 'aPattern', pattern: '^a-pattern$' }],
      })
        .valueOrThrow()
        .toPublishedSchema().spec,
    ).toEqual<PublishedSchemaSpecification>({
      schemaKind: 'published',
      version: 1,
      entityTypes: [
        {
          name: 'Foo',
          authKeyPattern: null,
          fields: [
            {
              name: 'field1',
              type: FieldType.String,
              list: false,
              required: false,
              multiline: false,
              index: null,
              values: [],
              matchPattern: 'aPattern',
            },
          ],
        },
      ],
      valueTypes: [],
      patterns: [{ name: 'aPattern', pattern: '^a-pattern$' }],
      indexes: [],
    });
  });

  test('1 entity type with index', () => {
    expect(
      AdminSchema.createAndValidate({
        entityTypes: [
          {
            name: 'Foo',
            fields: [{ name: 'field1', type: FieldType.String, index: 'anIndex' }],
          },
        ],
        indexes: [{ name: 'anIndex', type: 'unique' }],
      })
        .valueOrThrow()
        .toPublishedSchema().spec,
    ).toEqual<PublishedSchemaSpecification>({
      schemaKind: 'published',
      version: 1,
      entityTypes: [
        {
          name: 'Foo',
          authKeyPattern: null,
          fields: [
            {
              name: 'field1',
              type: FieldType.String,
              list: false,
              required: false,
              multiline: false,
              index: 'anIndex',
              matchPattern: null,
              values: [],
            },
          ],
        },
      ],
      valueTypes: [],
      patterns: [],
      indexes: [{ name: 'anIndex', type: 'unique' }],
    });
  });

  test('1 adminOnly entity type and 1 adminOnly value type', () => {
    expect(
      AdminSchema.createAndValidate({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: true,
            fields: [{ name: 'field1', type: FieldType.String }],
          },
        ],
        valueTypes: [
          { name: 'Bar', adminOnly: true, fields: [{ name: 'field1', type: FieldType.Location }] },
        ],
      })
        .valueOrThrow()
        .toPublishedSchema().spec,
    ).toEqual<PublishedSchemaSpecification>({
      schemaKind: 'published',
      version: 1,
      entityTypes: [],
      valueTypes: [],
      patterns: [],
      indexes: [],
    });
  });

  test('1 entity type with adminOnly field and 1 value type with adminOnly field', () => {
    expect(
      AdminSchema.createAndValidate({
        entityTypes: [
          {
            name: 'Foo',
            fields: [{ name: 'field1', adminOnly: true, type: FieldType.String }],
          },
        ],
        valueTypes: [
          {
            name: 'Bar',
            adminOnly: false,
            fields: [{ name: 'field1', adminOnly: true, type: FieldType.Location }],
          },
        ],
      })
        .valueOrThrow()
        .toPublishedSchema().spec,
    ).toEqual<PublishedSchemaSpecification>({
      schemaKind: 'published',
      version: 1,
      entityTypes: [{ name: 'Foo', authKeyPattern: null, fields: [] }],
      valueTypes: [{ name: 'Bar', fields: [] }],
      patterns: [],
      indexes: [],
    });
  });
});