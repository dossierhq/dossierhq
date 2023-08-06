import { describe, expect, test } from 'vitest';
import { ErrorType } from '../ErrorResult.js';
import { AdminSchema } from '../schema/AdminSchema.js';
import { FieldType } from '../schema/SchemaSpecification.js';
import { expectErrorResult } from '../test/CoreTestUtils.js';
import { assertIsDefined } from '../utils/Asserts.js';
import {
  normalizeContentField,
  normalizeEntityFields,
  normalizeValueItem,
} from './ContentNormalizer.js';
import {
  createRichText,
  createRichTextParagraphNode,
  createRichTextValueItemNode,
} from './RichTextUtils.js';

const schema = AdminSchema.createAndValidate({
  entityTypes: [
    {
      name: 'Foo',
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'stringList', type: FieldType.String, list: true },
        { name: 'twoStrings', type: FieldType.ValueItem, valueTypes: ['TwoStrings'] },
        { name: 'richText', type: FieldType.RichText },
      ],
    },
  ],
  valueTypes: [
    {
      name: 'TwoStrings',
      fields: [
        { name: 'string1', type: FieldType.String },
        { name: 'string2', type: FieldType.String },
      ],
    },
  ],
}).valueOrThrow();

function getEntityFieldSpec(schema: AdminSchema, entityType: string, fieldName: string) {
  const entitySpec = schema.getEntityTypeSpecification(entityType);
  assertIsDefined(entitySpec);
  const fieldSpec = schema.getEntityFieldSpecification(entitySpec, fieldName);
  assertIsDefined(fieldSpec);
  return fieldSpec;
}

describe('normalizeEntityFields', () => {
  test('empty Foo', () => {
    expect(
      normalizeEntityFields(schema, ['entity'], {
        info: { type: 'Foo' },
        fields: {},
      }).valueOrThrow(),
    ).toMatchSnapshot();
  });

  test('empty Foo (excludeOmittedEntityFields)', () => {
    expect(
      normalizeEntityFields(
        schema,
        ['entity'],
        { info: { type: 'Foo' }, fields: {} },
        { excludeOmittedEntityFields: true },
      ).valueOrThrow(),
    ).toEqual({});
  });

  test('empty fields in value item', () => {
    expect(
      normalizeEntityFields(schema, ['entity'], {
        info: { type: 'Foo' },
        fields: { twoStrings: { type: 'TwoStrings', string1: '', string2: null } },
      }).valueOrThrow(),
    ).toMatchSnapshot();
  });

  test('empty fields in value item in rich text', () => {
    expect(
      normalizeEntityFields(schema, ['entity'], {
        info: { type: 'Foo' },
        fields: {
          richText: createRichText([
            createRichTextValueItemNode({ type: 'TwoStrings', string1: '', string2: null }),
          ]),
        },
      }).valueOrThrow(),
    ).toMatchSnapshot();
  });
});

describe('normalizeValueItem', () => {
  test('empty TwoStrings', () => {
    expect(
      normalizeValueItem(schema, ['entity'], { type: 'TwoStrings' }).valueOrThrow(),
    ).toMatchSnapshot();
  });

  test('TwoStrings with empty strings', () => {
    expect(
      normalizeValueItem(schema, ['entity'], {
        type: 'TwoStrings',
        string1: '',
        string2: null,
      }).valueOrThrow(),
    ).toMatchSnapshot();
  });
});

describe('normalizeContentField()', () => {
  test('"" => null', () => {
    expect(
      normalizeContentField(
        schema,
        ['field'],
        getEntityFieldSpec(schema, 'Foo', 'string'),
        '',
      ).valueOrThrow(),
    ).toEqual(null);
  });

  test('[] => null', () => {
    expect(
      normalizeContentField(
        schema,
        ['field'],
        getEntityFieldSpec(schema, 'Foo', 'stringList'),
        [],
      ).valueOrThrow(),
    ).toBe(null);
  });

  test('[string, ""] => [string]', () => {
    expect(
      normalizeContentField(schema, ['field'], getEntityFieldSpec(schema, 'Foo', 'stringList'), [
        'hello',
        '',
      ]).valueOrThrow(),
    ).toEqual(['hello']);
  });

  test('[string] => [string] (no change)', () => {
    const fieldValue = ['hello', 'world'];
    expect(
      normalizeContentField(
        schema,
        ['field'],
        getEntityFieldSpec(schema, 'Foo', 'stringList'),
        fieldValue,
      ).valueOrThrow(),
    ).toBe(fieldValue);
  });

  test('{string1:string,string2:""} => {string1:string,string2:null}', () => {
    expect(
      normalizeContentField(schema, ['field'], getEntityFieldSpec(schema, 'Foo', 'twoStrings'), {
        type: 'TwoStrings',
        string1: 'Hello',
        string2: '',
      }).valueOrThrow(),
    ).toEqual({ type: 'TwoStrings', string1: 'Hello', string2: null });
  });

  test('{string1:undefined} => {string1:null,string2:null}', () => {
    expect(
      normalizeContentField(schema, ['field'], getEntityFieldSpec(schema, 'Foo', 'twoStrings'), {
        type: 'TwoStrings',
        string1: undefined,
        // no string2
      }).valueOrThrow(),
    ).toEqual({ type: 'TwoStrings', string1: null, string2: null });
  });

  test('{string1:string,string2:string} => {string1:string,string2:string} (no change)', () => {
    const fieldValue = {
      type: 'TwoStrings',
      string1: 'Hello',
      string2: 'World',
    };
    expect(
      normalizeContentField(
        schema,
        ['field'],
        getEntityFieldSpec(schema, 'Foo', 'twoStrings'),
        fieldValue,
      ).valueOrThrow(),
    ).toBe(fieldValue);
  });

  test('string undefined => null', () => {
    expect(
      normalizeContentField(
        schema,
        ['field'],
        getEntityFieldSpec(schema, 'Foo', 'string'),
        undefined,
      ).valueOrThrow(),
    ).toBe(null);
  });

  test('string[] undefined => null', () => {
    expect(
      normalizeContentField(
        schema,
        ['field'],
        getEntityFieldSpec(schema, 'Foo', 'stringList'),
        undefined,
      ).valueOrThrow(),
    ).toBe(null);
  });

  test('ValueItem: undefined => null', () => {
    expect(
      normalizeContentField(
        schema,
        ['field'],
        getEntityFieldSpec(schema, 'Foo', 'twoStrings'),
        undefined,
      ).valueOrThrow(),
    ).toBe(null);
  });

  test('RichText: empty paragraph => null', () => {
    expect(
      normalizeContentField(
        schema,
        ['field'],
        getEntityFieldSpec(schema, 'Foo', 'richText'),
        createRichText([createRichTextParagraphNode([])]),
      ).valueOrThrow(),
    ).toBe(null);
  });

  test('error: RichText: invalid rich text (no root)', () => {
    expectErrorResult(
      normalizeContentField(schema, ['field'], getEntityFieldSpec(schema, 'Foo', 'richText'), {}),
      ErrorType.BadRequest,
      'field: RichText object is missing root',
    );
  });

  test('error: RichText: invalid rich text (string in root)', () => {
    expectErrorResult(
      normalizeContentField(schema, ['field'], getEntityFieldSpec(schema, 'Foo', 'richText'), {
        root: 'hello world',
      }),
      ErrorType.BadRequest,
      'field.root: Expected a RichText node, got string',
    );
  });
});
