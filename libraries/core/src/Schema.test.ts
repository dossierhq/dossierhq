import { describe, expect, test } from 'vitest';
import { expectErrorResult, expectOkResult } from './CoreTestUtils.js';
import { ErrorType } from './ErrorResult.js';
import { AdminSchema, FieldType, RichTextNodeType } from './Schema.js';

describe('mergeWith()', () => {
  test('empty->empty->empty', () => {
    expect(
      new AdminSchema({ entityTypes: [], valueTypes: [], patterns: [] })
        .mergeWith({})
        .valueOrThrow().spec
    ).toEqual({
      entityTypes: [],
      valueTypes: [],
      patterns: [],
    });
  });

  test('empty->entity with pattern', () => {
    expect(
      new AdminSchema({ entityTypes: [], valueTypes: [], patterns: [] })
        .mergeWith({
          entityTypes: [{ name: 'Foo', authKeyPattern: 'a-pattern', fields: [] }],
          patterns: [{ name: 'a-pattern', pattern: '^hello$' }],
        })
        .valueOrThrow().spec
    ).toMatchSnapshot();
  });

  test('update pattern', () => {
    const result = new AdminSchema({
      entityTypes: [{ name: 'Foo', adminOnly: false, authKeyPattern: 'a-pattern', fields: [] }],
      valueTypes: [],
      patterns: [{ name: 'a-pattern', pattern: '^old-pattern$' }],
    })
      .mergeWith({
        patterns: [{ name: 'a-pattern', pattern: '^new-pattern$' }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.getPattern('a-pattern')?.pattern).toBe('^new-pattern$');
  });

  test('unused pattern is removed', () => {
    const result = new AdminSchema({
      entityTypes: [{ name: 'Foo', adminOnly: false, authKeyPattern: 'a-pattern', fields: [] }],
      valueTypes: [],
      patterns: [{ name: 'a-pattern', pattern: '^pattern$' }],
    })
      .mergeWith({
        entityTypes: [{ name: 'Foo', adminOnly: false, authKeyPattern: null, fields: [] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.spec.patterns.length).toBe(0);
  });
});

describe('validate()', () => {
  test('Empty spec validates', () => {
    expectOkResult(new AdminSchema({ entityTypes: [], valueTypes: [], patterns: [] }).validate());
  });

  test('Limit value and entity types on rich text', () => {
    expectOkResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                valueTypes: ['Value'],
                entityTypes: ['Foo'],
                linkEntityTypes: ['Foo'],
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
        patterns: [],
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
            authKeyPattern: null,
            fields: [{ name: 'bar', type: 'Invalid' as FieldType }],
          },
        ],
        valueTypes: [],
        patterns: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Specified type Invalid doesn’t exist'
    );
  });

  test('Error: Duplicate entity type names', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          { name: 'Foo', adminOnly: false, authKeyPattern: null, fields: [] },
          { name: 'Foo', adminOnly: false, authKeyPattern: null, fields: [] },
        ],
        valueTypes: [],
        patterns: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo: Duplicate type name'
    );
  });

  test('Error: Duplicate entity and value type names', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [{ name: 'Foo', adminOnly: false, authKeyPattern: null, fields: [] }],
        valueTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
        patterns: [],
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
        patterns: [],
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
            authKeyPattern: null,
            fields: [{ name: 'boolean', type: FieldType.Boolean, multiline: true }],
          },
        ],
        valueTypes: [],
        patterns: [],
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
            authKeyPattern: null,
            fields: [{ name: 'bar', type: FieldType.EntityType, entityTypes: ['Invalid'] }],
          },
        ],
        valueTypes: [],
        patterns: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced entity type in entityTypes Invalid doesn’t exist'
    );
  });

  test('Error: Reference to invalid entity type in linkEntityTypes', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            fields: [{ name: 'bar', type: FieldType.RichText, linkEntityTypes: ['Invalid'] }],
          },
        ],
        valueTypes: [],
        patterns: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced entity type in linkEntityTypes Invalid doesn’t exist'
    );
  });

  test('Error: entityTypes specified on String field', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            fields: [{ name: 'bar', type: FieldType.String, entityTypes: ['Bar'] }],
          },
          { name: 'Bar', adminOnly: false, authKeyPattern: null, fields: [] },
        ],
        valueTypes: [],
        patterns: [],
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
            authKeyPattern: null,
            fields: [{ name: 'bar', type: FieldType.ValueType, valueTypes: ['Invalid'] }],
          },
        ],
        valueTypes: [],
        patterns: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Value type in valueTypes Invalid doesn’t exist'
    );
  });

  test('Error: linkEntityTypes specified on String field', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            fields: [{ name: 'bar', type: FieldType.String, linkEntityTypes: ['Bar'] }],
          },
          { name: 'Bar', adminOnly: false, authKeyPattern: null, fields: [] },
        ],
        valueTypes: [],
        patterns: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Field with type String shouldn’t specify linkEntityTypes'
    );
  });

  test('Error: valueTypes specified on String field', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            fields: [{ name: 'bar', type: FieldType.String, valueTypes: ['Bar'] }],
          },
          { name: 'Bar', adminOnly: false, authKeyPattern: null, fields: [] },
        ],
        valueTypes: [],
        patterns: [],
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
            authKeyPattern: null,
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
        patterns: [],
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
            authKeyPattern: null,
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
        patterns: [],
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
            authKeyPattern: null,
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
        patterns: [],
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
            authKeyPattern: null,
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
        patterns: [],
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
            authKeyPattern: null,
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
        patterns: [],
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
            authKeyPattern: null,
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
        patterns: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: entityTypes is specified for field, but richTextNodes is missing entity'
    );
  });

  test('Error: linkEntityTypes specified but not entityLink richTextNodes', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                linkEntityTypes: ['Foo'],
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
        patterns: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: linkEntityTypes is specified for field, but richTextNodes is missing entityLink'
    );
  });

  test('Error: valueTypes specified but not valueItem richTextNodes', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
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
        patterns: [],
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
            authKeyPattern: null,
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
            authKeyPattern: null,
            fields: [],
          },
        ],
        valueTypes: [],
        patterns: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced entity type in entityTypes (Bar) is adminOnly, but Foo isn’t'
    );
  });

  test('Error: referencing adminOnly link entity from non-adminOnly', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            fields: [
              {
                name: 'bar',
                type: FieldType.RichText,
                linkEntityTypes: ['Bar'],
              },
            ],
          },
          {
            name: 'Bar',
            adminOnly: true,
            authKeyPattern: null,
            fields: [],
          },
        ],
        valueTypes: [],
        patterns: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced entity type in linkEntityTypes (Bar) is adminOnly, but Foo isn’t'
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
        patterns: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced value type in valueTypes (Bar) is adminOnly, but Foo isn’t'
    );
  });

  test('Error: duplicate pattern', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [],
        valueTypes: [],
        patterns: [
          { name: 'a-pattern', pattern: '^a-pattern$' },
          { name: 'a-pattern', pattern: '^duplicate$' },
        ],
      }).validate(),
      ErrorType.BadRequest,
      'a-pattern: Duplicate pattern name'
    );
  });

  test('Error: entity authKey using missing pattern', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [{ name: 'Foo', adminOnly: false, authKeyPattern: 'missing', fields: [] }],
        valueTypes: [],
        patterns: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo: Unknown authKeyPattern (missing)'
    );
  });

  test('Error: invalid pattern', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [],
        valueTypes: [],
        patterns: [{ name: 'a-pattern', pattern: 'invalid\\' }],
      }).validate(),
      ErrorType.BadRequest,
      'a-pattern: Invalid regex'
    );
  });
});

describe('AdminSchema.toPublishedSchema()', () => {
  test('empty->empty', () => {
    expect(
      new AdminSchema({ entityTypes: [], valueTypes: [], patterns: [] }).toPublishedSchema().spec
    ).toEqual({
      entityTypes: [],
      valueTypes: [],
      patterns: [],
    });
  });

  test('1 entity type and 1 value type', () => {
    expect(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            fields: [{ name: 'field1', type: FieldType.String }],
          },
        ],
        valueTypes: [
          { name: 'Bar', adminOnly: false, fields: [{ name: 'field1', type: FieldType.Location }] },
        ],
        patterns: [],
      }).toPublishedSchema().spec
    ).toEqual({
      entityTypes: [
        { name: 'Foo', authKeyPattern: null, fields: [{ name: 'field1', type: FieldType.String }] },
      ],
      valueTypes: [{ name: 'Bar', fields: [{ name: 'field1', type: FieldType.Location }] }],
      patterns: [],
    });
  });

  test('1 adminOnly entity type and 1 adminOnly value type', () => {
    expect(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: true,
            authKeyPattern: null,
            fields: [{ name: 'field1', type: FieldType.String }],
          },
        ],
        valueTypes: [
          { name: 'Bar', adminOnly: true, fields: [{ name: 'field1', type: FieldType.Location }] },
        ],
        patterns: [],
      }).toPublishedSchema().spec
    ).toEqual({
      entityTypes: [],
      valueTypes: [],
      patterns: [],
    });
  });

  test('1 entity type with adminOnly field and 1 value type with adminOnly field', () => {
    expect(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
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
        patterns: [],
      }).toPublishedSchema().spec
    ).toEqual({
      entityTypes: [{ name: 'Foo', authKeyPattern: null, fields: [] }],
      valueTypes: [{ name: 'Bar', fields: [] }],
      patterns: [],
    });
  });
});
