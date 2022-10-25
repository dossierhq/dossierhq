import { describe, expect, test } from 'vitest';
import { expectErrorResult, expectOkResult } from './CoreTestUtils.js';
import { ErrorType } from './ErrorResult.js';
import { AdminSchema, FieldType, RichTextNodeType } from './Schema.js';

describe('mergeWith()', () => {
  test('empty->empty->empty', () => {
    expect(
      new AdminSchema({ entityTypes: [], valueTypes: [], patterns: [], indexes: [] })
        .mergeWith({})
        .valueOrThrow().spec
    ).toEqual({
      entityTypes: [],
      valueTypes: [],
      patterns: [],
      indexes: [],
    });
  });

  test('empty->entity with pattern', () => {
    expect(
      new AdminSchema({ entityTypes: [], valueTypes: [], patterns: [], indexes: [] })
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
      indexes: [],
    })
      .mergeWith({
        patterns: [{ name: 'a-pattern', pattern: '^new-pattern$' }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.getPattern('a-pattern')?.pattern).toBe('^new-pattern$');
    expect(result.getPatternRegExp('a-pattern')?.source).toBe('^new-pattern$');
  });

  test('unused pattern is removed', () => {
    const result = new AdminSchema({
      entityTypes: [{ name: 'Foo', adminOnly: false, authKeyPattern: 'a-pattern', fields: [] }],
      valueTypes: [],
      patterns: [{ name: 'a-pattern', pattern: '^pattern$' }],
      indexes: [],
    })
      .mergeWith({
        entityTypes: [{ name: 'Foo', adminOnly: false, authKeyPattern: null, fields: [] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.spec.patterns.length).toBe(0);
  });

  test('field with matchPattern', () => {
    const result = new AdminSchema({ entityTypes: [], valueTypes: [], patterns: [], indexes: [] })
      .mergeWith({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [{ name: 'title', type: FieldType.String, matchPattern: 'a-pattern' }],
          },
        ],
        patterns: [{ name: 'a-pattern', pattern: '^pattern$' }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.getPattern('a-pattern')?.pattern).toBe('^pattern$');
  });

  test('unused index is removed', () => {
    const result = new AdminSchema({
      entityTypes: [
        {
          name: 'Foo',
          adminOnly: false,
          authKeyPattern: null,
          fields: [{ name: 'string', type: FieldType.String, index: 'anIndex' }],
        },
      ],
      valueTypes: [],
      patterns: [],
      indexes: [{ name: 'anIndex', type: 'unique' }],
    })
      .mergeWith({
        entityTypes: [{ name: 'Foo', adminOnly: false, authKeyPattern: null, fields: [] }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.spec.indexes.length).toBe(0);
  });

  test('field with index', () => {
    const result = new AdminSchema({ entityTypes: [], valueTypes: [], patterns: [], indexes: [] })
      .mergeWith({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            fields: [{ name: 'title', type: FieldType.String, index: 'unique-index' }],
          },
        ],
        indexes: [{ name: 'unique-index', type: 'unique' }],
      })
      .valueOrThrow();

    expect(result.spec).toMatchSnapshot();
    expect(result.getIndex('unique-index')).toEqual({ name: 'unique-index', type: 'unique' });
  });
});

describe('validate()', () => {
  test('Empty spec validates', () => {
    expectOkResult(
      new AdminSchema({ entityTypes: [], valueTypes: [], patterns: [], indexes: [] }).validate()
    );
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.bar: Referenced value type in valueTypes (Bar) is adminOnly, but Foo isn’t'
    );
  });

  test('Error: Boolean (i.e. non-String) with matchPattern', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            fields: [{ name: 'boolean', type: FieldType.Boolean, matchPattern: 'foo' }],
          },
        ],
        valueTypes: [],
        patterns: [{ name: 'foo', pattern: '^foo$' }],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.boolean: Field with type Boolean shouldn’t specify matchPattern'
    );
  });

  test('Error: matchPattern with missing pattern name', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            fields: [{ name: 'string', type: FieldType.String, matchPattern: 'foo' }],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.string: Unknown matchPattern (foo)'
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
        indexes: [],
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
        indexes: [],
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
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'a-pattern: Invalid regex'
    );
  });

  test('Error: Boolean (i.e. non-String) with index', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            fields: [{ name: 'boolean', type: FieldType.Boolean, index: 'anIndex' }],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [{ name: 'anIndex', type: 'unique' }],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.boolean: Field with type Boolean shouldn’t specify index'
    );
  });

  test('Error: index with missing index name', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            fields: [{ name: 'string', type: FieldType.String, index: 'foo' }],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).validate(),
      ErrorType.BadRequest,
      'Foo.string: Unknown index (foo)'
    );
  });

  test('Error: duplicate index', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [],
        valueTypes: [],
        patterns: [],
        indexes: [
          { name: 'anIndex', type: 'unique' },
          { name: 'anIndex', type: 'unique' },
        ],
      }).validate(),
      ErrorType.BadRequest,
      'anIndex: Duplicate index name'
    );
  });

  test('Error: non-camelCase index', () => {
    expectErrorResult(
      new AdminSchema({
        entityTypes: [],
        valueTypes: [],
        patterns: [],
        indexes: [{ name: 'an-index', type: 'unique' }],
      }).validate(),
      ErrorType.BadRequest,
      'an-index: The index name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myIndex_123'
    );
  });
});

describe('AdminSchema.toPublishedSchema()', () => {
  test('empty->empty', () => {
    expect(
      new AdminSchema({
        entityTypes: [],
        valueTypes: [],
        patterns: [],
        indexes: [],
      }).toPublishedSchema().spec
    ).toEqual({ entityTypes: [], valueTypes: [], patterns: [], indexes: [] });
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
        indexes: [],
      }).toPublishedSchema().spec
    ).toEqual({
      entityTypes: [
        { name: 'Foo', authKeyPattern: null, fields: [{ name: 'field1', type: FieldType.String }] },
      ],
      valueTypes: [{ name: 'Bar', fields: [{ name: 'field1', type: FieldType.Location }] }],
      patterns: [],
      indexes: [],
    });
  });

  test('1 entity type with pattern used by matchPattern', () => {
    expect(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            fields: [{ name: 'field1', type: FieldType.String, matchPattern: 'a-pattern' }],
          },
        ],
        valueTypes: [],
        patterns: [{ name: 'a-pattern', pattern: '^a-pattern$' }],
        indexes: [],
      }).toPublishedSchema().spec
    ).toEqual({
      entityTypes: [
        {
          name: 'Foo',
          authKeyPattern: null,
          fields: [{ name: 'field1', type: FieldType.String, matchPattern: 'a-pattern' }],
        },
      ],
      valueTypes: [],
      patterns: [{ name: 'a-pattern', pattern: '^a-pattern$' }],
      indexes: [],
    });
  });

  test('1 entity type with index', () => {
    expect(
      new AdminSchema({
        entityTypes: [
          {
            name: 'Foo',
            adminOnly: false,
            authKeyPattern: null,
            fields: [{ name: 'field1', type: FieldType.String, index: 'anIndex' }],
          },
        ],
        valueTypes: [],
        patterns: [],
        indexes: [{ name: 'anIndex', type: 'unique' }],
      }).toPublishedSchema().spec
    ).toEqual({
      entityTypes: [
        {
          name: 'Foo',
          authKeyPattern: null,
          fields: [{ name: 'field1', type: FieldType.String, index: 'anIndex' }],
        },
      ],
      valueTypes: [],
      patterns: [],
      indexes: [{ name: 'anIndex', type: 'unique' }],
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
        indexes: [],
      }).toPublishedSchema().spec
    ).toEqual({
      entityTypes: [],
      valueTypes: [],
      patterns: [],
      indexes: [],
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
        indexes: [],
      }).toPublishedSchema().spec
    ).toEqual({
      entityTypes: [{ name: 'Foo', authKeyPattern: null, fields: [] }],
      valueTypes: [{ name: 'Bar', fields: [] }],
      patterns: [],
      indexes: [],
    });
  });
});
