import { describe, expect, test } from 'vitest';
import { AdminSchema } from '../schema/AdminSchema.js';
import { FieldType } from '../schema/SchemaSpecification.js';
import { assertIsDefined } from '../utils/Asserts.js';
import {
  normalizeEntityFields,
  normalizeFieldValue,
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
      normalizeEntityFields(schema, { info: { type: 'Foo' }, fields: {} }).valueOrThrow(),
    ).toMatchSnapshot();
  });

  test('empty Foo (excludeOmitted)', () => {
    expect(
      normalizeEntityFields(
        schema,
        { info: { type: 'Foo' }, fields: {} },
        { excludeOmitted: true },
      ).valueOrThrow(),
    ).toEqual({});
  });

  test('empty fields in value item', () => {
    expect(
      normalizeEntityFields(schema, {
        info: { type: 'Foo' },
        fields: { twoStrings: { type: 'TwoStrings', string1: '', string2: null } },
      }).valueOrThrow(),
    ).toMatchSnapshot();
  });

  test('empty fields in value item in rich text', () => {
    expect(
      normalizeEntityFields(schema, {
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
    expect(normalizeValueItem(schema, { type: 'TwoStrings' }).valueOrThrow()).toMatchSnapshot();
  });

  test('TwoStrings with empty strings', () => {
    expect(
      normalizeValueItem(schema, { type: 'TwoStrings', string1: '', string2: null }).valueOrThrow(),
    ).toMatchSnapshot();
  });
});

describe('normalizeFieldValue()', () => {
  test('"" => null', () => {
    expect(normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'string'), '')).toEqual(
      null,
    );
  });

  test('[] => null', () => {
    expect(normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'stringList'), [])).toBe(
      null,
    );
  });

  test('[string, ""] => [string]', () => {
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'stringList'), ['hello', '']),
    ).toEqual(['hello']);
  });

  test('[string] => [string] (no change)', () => {
    const fieldValue = ['hello', 'world'];
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'stringList'), fieldValue),
    ).toBe(fieldValue);
  });

  test('{string1:string,string2:""} => {string1:string,string2:null}', () => {
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'twoStrings'), {
        type: 'TwoStrings',
        string1: 'Hello',
        string2: '',
      }),
    ).toEqual({ type: 'TwoStrings', string1: 'Hello', string2: null });
  });

  test('{string1:undefined} => {string1:null,string2:null}', () => {
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'twoStrings'), {
        type: 'TwoStrings',
        string1: undefined,
        // no string2
      }),
    ).toEqual({ type: 'TwoStrings', string1: null, string2: null });
  });

  test('{string1:string,string2:string} => {string1:string,string2:string} (no change)', () => {
    const fieldValue = {
      type: 'TwoStrings',
      string1: 'Hello',
      string2: 'World',
    };
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'twoStrings'), fieldValue),
    ).toBe(fieldValue);
  });

  test('string undefined => null', () => {
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'string'), undefined),
    ).toBe(null);
  });

  test('string[] undefined => null', () => {
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'stringList'), undefined),
    ).toBe(null);
  });

  test('ValueItem: undefined => null', () => {
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'twoStrings'), undefined),
    ).toBe(null);
  });

  test('RichText: empty paragraph => null', () => {
    expect(
      normalizeFieldValue(
        schema,
        getEntityFieldSpec(schema, 'Foo', 'richText'),
        createRichText([createRichTextParagraphNode([])]),
      ),
    ).toBe(null);
  });

  test('RichText: let invalid rich text pass through (no root)', () => {
    expect(normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'richText'), {})).toEqual(
      {},
    );
  });

  test('RichText: let invalid rich text pass through (string in root)', () => {
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'richText'), {
        root: 'hello world',
      }),
    ).toEqual({ root: 'hello world' });
  });
});
