import { describe, expect, test } from 'vitest';
import { assertIsDefined } from './Asserts.js';
import {
  copyEntity,
  isEntityNameAsRequested,
  isFieldValueEqual,
  normalizeEntityFields,
  normalizeFieldValue,
} from './ItemUtils.js';
import { createRichTextParagraphNode, createRichTextRootNode } from './RichTextUtils.js';
import { AdminSchema, FieldType } from './Schema.js';
import type { AdminEntity, AdminEntityCreate, RichText, ValueItem } from './Types.js';

type AdminFoo = AdminEntity<'Foo', AdminFooFields, 'none'>;

interface AdminFooFields {
  string: string | null;
  stringList: string[] | null;
  twoStrings: AdminTwoStrings | null;
  richText: RichText | null;
}

type AdminTwoStrings = ValueItem<'TwoStrings', AdminTwoStringsFields>;

interface AdminTwoStringsFields {
  string1: string | null;
  string2: string | null;
}

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

describe('copyEntity', () => {
  test('AdminEntityCreate with app type', () => {
    const entity: AdminEntityCreate<AdminFoo> = {
      info: { type: 'Foo', authKey: 'none', name: 'Name' },
      fields: { string: 'hello' },
    };
    const copy: AdminEntityCreate<AdminFoo> = copyEntity(entity, {
      fields: { stringList: ['world'] },
    });
    expect(copy).toEqual({
      info: { authKey: 'none', name: 'Name', type: 'Foo' },
      fields: { string: 'hello', stringList: ['world'] },
    });
  });
});

describe('isEntityNameAsRequested', () => {
  test('hello=hello', () => expect(isEntityNameAsRequested('hello', 'hello')).toBeTruthy());
  test('hello#123=hello', () => expect(isEntityNameAsRequested('hello#123', 'hello')).toBeTruthy());
  test('hello#123=hello#123', () =>
    expect(isEntityNameAsRequested('hello#123', 'hello#123')).toBeTruthy());

  test('hello!=world', () => expect(isEntityNameAsRequested('hello', 'world')).toBeFalsy());
  test('hello#456!=hello#123', () =>
    expect(isEntityNameAsRequested('hello#456', 'hello#123')).toBeFalsy());
});

describe('isFieldValueEqual', () => {
  test('string===string', () => expect(isFieldValueEqual('hello', 'hello')).toBeTruthy());
  test('string!==null', () => expect(isFieldValueEqual('hello', null)).toBeFalsy());
  test('string!==other string', () => expect(isFieldValueEqual('hello', 'world')).toBeFalsy());
  test('string[]===string[]', () =>
    expect(isFieldValueEqual(['hello', 'world'], ['hello', 'world'])).toBeTruthy());
  test('string[]!==string[] (order)', () =>
    expect(isFieldValueEqual(['hello', 'world'], ['world', 'hello'])).toBeFalsy());

  test('value item===value item', () =>
    expect(
      isFieldValueEqual(
        {
          type: 'Foo',
          string: 'string',
          stringList: ['string', 'list'],
          entity: { id: 'entity-id-1' },
          entityList: [{ id: 'entity-id-1' }],
        },
        {
          type: 'Foo',
          string: 'string',
          stringList: ['string', 'list'],
          entity: { id: 'entity-id-1' },
          entityList: [{ id: 'entity-id-1' }],
        }
      )
    ).toBeTruthy());

  test('value item!==value item', () =>
    expect(
      isFieldValueEqual(
        {
          type: 'Foo',
          string: 'string',
          stringList: ['string', 'list'],
          entity: { id: 'entity-id-1' },
          entityList: [{ id: 'entity-id-1' }],
        },
        {
          type: 'Foo',
          string: 'string',
          stringList: ['string', 'DIFFERENCE'],
          entity: { id: 'entity-id-1' },
          entityList: [{ id: 'entity-id-1' }],
        }
      )
    ).toBeFalsy());
});

describe('normalizeEntityFields', () => {
  test('empty Foo', () => {
    expect(
      normalizeEntityFields(schema, { info: { type: 'Foo' }, fields: {} }).valueOrThrow()
    ).toMatchSnapshot();
  });

  test('empty Foo (excludeOmitted)', () => {
    expect(
      normalizeEntityFields(
        schema,
        { info: { type: 'Foo' }, fields: {} },
        { excludeOmitted: true }
      ).valueOrThrow()
    ).toEqual({});
  });
});

describe('normalizeFieldValue()', () => {
  test('"" => null', () => {
    expect(normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'string'), '')).toEqual(
      null
    );
  });

  test('[] => null', () => {
    expect(normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'stringList'), [])).toBe(
      null
    );
  });

  test('[string, ""] => [string]', () => {
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'stringList'), ['hello', ''])
    ).toEqual(['hello']);
  });

  test('[string] => [string] (no change)', () => {
    const fieldValue = ['hello', 'world'];
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'stringList'), fieldValue)
    ).toBe(fieldValue);
  });

  test('{string1:string,string2:""} => {string1:string,string2:null}', () => {
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'twoStrings'), {
        type: 'TwoStrings',
        string1: 'Hello',
        string2: '',
      })
    ).toEqual({ type: 'TwoStrings', string1: 'Hello', string2: null });
  });

  test('{string1:undefined} => {string1:null,string2:null}', () => {
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'twoStrings'), {
        type: 'TwoStrings',
        string1: undefined,
        // no string2
      })
    ).toEqual({ type: 'TwoStrings', string1: null, string2: null });
  });

  test('{string1:string,string2:string} => {string1:string,string2:string} (no change)', () => {
    const fieldValue = {
      type: 'TwoStrings',
      string1: 'Hello',
      string2: 'World',
    };
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'twoStrings'), fieldValue)
    ).toBe(fieldValue);
  });

  test('string undefined => undefined', () => {
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'string'), undefined)
    ).toBe(undefined);
  });

  test('string[] undefined => undefined', () => {
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'stringList'), undefined)
    ).toBe(undefined);
  });

  test('ValueItem: undefined => undefined', () => {
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'twoStrings'), undefined)
    ).toBe(undefined);
  });

  test('RichText: empty paragraph => null', () => {
    expect(
      normalizeFieldValue(
        schema,
        getEntityFieldSpec(schema, 'Foo', 'richText'),
        createRichTextRootNode([createRichTextParagraphNode([])])
      )
    ).toBe(null);
  });

  test('RichText: let invalid rich text pass through (no root)', () => {
    expect(normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'richText'), {})).toEqual(
      {}
    );
  });

  test('RichText: let invalid rich text pass through (string in root)', () => {
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'richText'), {
        root: 'hello world',
      })
    ).toEqual({ root: 'hello world' });
  });
});
