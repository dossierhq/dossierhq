import { describe, expect, test } from 'vitest';
import { ErrorType, ok } from '../ErrorResult.js';
import type { Component } from '../Types.js';
import { createRichText, createRichTextValueItemNode } from '../content/RichTextUtils.js';
import { AdminSchemaWithMigrations } from '../schema/AdminSchema.js';
import { FieldType } from '../schema/SchemaSpecification.js';
import { expectErrorResult } from '../test/CoreTestUtils.js';
import { contentValuePathToString } from './ContentPath.js';
import {
  IDENTITY_TRANSFORMER,
  transformEntityFields,
  transformValueItem,
} from './ContentTransformer.js';
import { isRichTextValueItemNode, isComponentItemField } from './ContentTypeUtils.js';
import { copyEntity } from './ContentUtils.js';

const ADMIN_SCHEMA = AdminSchemaWithMigrations.createAndValidate({
  entityTypes: [
    {
      name: 'StringsEntity',
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'stringList', type: FieldType.String, list: true },
      ],
    },
    {
      name: 'ValueItemsEntity',
      fields: [
        { name: 'richText', type: FieldType.RichText },
        { name: 'valueItem', type: FieldType.Component },
        { name: 'valueItemList', type: FieldType.Component, list: true },
      ],
    },
  ],
  componentTypes: [
    {
      name: 'NestedValueItem',
      fields: [
        { name: 'child', type: FieldType.Component },
        { name: 'string', type: FieldType.String },
      ],
    },
  ],
}).valueOrThrow();

const STRINGS_ENTITY_1 = Object.freeze({
  info: { type: 'StringsEntity' },
  fields: {
    string: '1',
    stringList: ['1', '2'],
  },
});

const VALUE_ITEMS_ENTITY_1 = Object.freeze({
  info: { type: 'ValueItemsEntity' },
  fields: {
    richText: createRichText([
      createRichTextValueItemNode({ type: 'NestedValueItem', child: null, string: null }),
    ]),
    valueItem: {
      type: 'NestedValueItem',
      string: '1',
      child: { type: 'NestedValueItem', string: '1.1', child: null },
    },
    valueItemList: [
      { type: 'NestedValueItem', string: '1', child: null },
      { type: 'NestedValueItem', string: '2', child: null },
    ],
  },
});

describe('transformEntity', () => {
  test('identity', () => {
    const calls: unknown[][] = [];
    const transformed = transformEntityFields(ADMIN_SCHEMA, [], VALUE_ITEMS_ENTITY_1, {
      transformField: (_schema, path, _fieldSpec, value) => {
        calls.push(['transformField', contentValuePathToString(path)]);
        return ok(value);
      },
      transformFieldItem: (_schema, path, _fieldSpec, value) => {
        calls.push(['transformFieldItem', contentValuePathToString(path)]);
        return ok(value);
      },
      transformRichTextNode: (_schema, path, _fieldSpec, node) => {
        calls.push(['transformRichTextNode', contentValuePathToString(path)]);
        return ok(node);
      },
    }).valueOrThrow();
    expect(transformed).toBe(VALUE_ITEMS_ENTITY_1.fields);
    expect(calls).toMatchSnapshot();
  });

  test('delete all value items', () => {
    const transformed = transformEntityFields(ADMIN_SCHEMA, [], VALUE_ITEMS_ENTITY_1, {
      transformField: (_schema, _path, _fieldSpec, value) => ok(value),
      transformFieldItem: (_schema, _path, fieldSpec, value) => {
        if (isComponentItemField(fieldSpec, value)) return ok(null);
        return ok(value);
      },
      transformRichTextNode: (_schema, _path, _fieldSpec, node) =>
        ok(isRichTextValueItemNode(node) ? null : node),
    }).valueOrThrow();
    expect(transformed).toMatchSnapshot();
  });

  test('normalize entity fields: extra', () => {
    const transformed = transformEntityFields(
      ADMIN_SCHEMA,
      ['entity'],
      copyEntity(STRINGS_ENTITY_1, {
        fields: { extra: 'hello' } as unknown as typeof STRINGS_ENTITY_1.fields,
      }),
      IDENTITY_TRANSFORMER,
    ).valueOrThrow();
    expect(transformed).toEqual({ string: '1', stringList: ['1', '2'] });
  });

  test('normalize entity fields: extra with keepExtraFields', () => {
    const transformed = transformEntityFields(
      ADMIN_SCHEMA,
      ['entity'],
      copyEntity(STRINGS_ENTITY_1, {
        fields: { extra: 'hello' } as unknown as typeof STRINGS_ENTITY_1.fields,
      }),
      IDENTITY_TRANSFORMER,
      { keepExtraFields: true },
    ).valueOrThrow();
    expect(transformed).toEqual({ extra: 'hello', string: '1', stringList: ['1', '2'] });
  });

  test('normalize list: empty', () => {
    const transformed = transformEntityFields(
      ADMIN_SCHEMA,
      ['entity'],
      copyEntity(STRINGS_ENTITY_1, { fields: { stringList: [] } }),
      IDENTITY_TRANSFORMER,
    ).valueOrThrow();
    expect(transformed.stringList).toBe(null);
  });

  test('normalize string: empty', () => {
    const transformed = transformEntityFields(
      ADMIN_SCHEMA,
      ['entity'],
      copyEntity(STRINGS_ENTITY_1, { fields: { string: '' } }),
      IDENTITY_TRANSFORMER,
    ).valueOrThrow();
    expect(transformed.string).toBe(null);
  });

  test('normalize value item: extra fields', () => {
    const copy = copyEntity(VALUE_ITEMS_ENTITY_1, {
      fields: {
        valueItem: {
          type: 'NestedValueItem',
          unsupported: 'hello',
        } as unknown as typeof VALUE_ITEMS_ENTITY_1.fields.valueItem,
      },
    });
    const transformed = transformEntityFields(
      ADMIN_SCHEMA,
      ['entity'],
      copy,
      IDENTITY_TRANSFORMER,
    ).valueOrThrow();
    expect(transformed.valueItem).toEqual({ type: 'NestedValueItem', child: null, string: null });
  });

  test('normalize value item: extra fields with keepExtraFields', () => {
    const copy = copyEntity(VALUE_ITEMS_ENTITY_1, {
      fields: {
        valueItem: {
          type: 'NestedValueItem',
          unsupported: 'hello',
        } as unknown as typeof VALUE_ITEMS_ENTITY_1.fields.valueItem,
      },
    });
    const transformed = transformEntityFields(
      ADMIN_SCHEMA,
      ['entity'],
      copy,
      IDENTITY_TRANSFORMER,
      { keepExtraFields: true },
    ).valueOrThrow();
    expect(transformed.valueItem).toEqual({
      type: 'NestedValueItem',
      child: null,
      string: null,
      unsupported: 'hello',
    });
  });

  test('error: invalid entity type name', () => {
    const result = transformEntityFields(
      ADMIN_SCHEMA,
      ['entity'],
      copyEntity(STRINGS_ENTITY_1, { info: { type: 'Invalid' } }),
      IDENTITY_TRANSFORMER,
    );
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity: Couldn’t find spec for entity type Invalid',
    );
  });

  test('error: missing type in value item', () => {
    const copy = copyEntity(VALUE_ITEMS_ENTITY_1, {
      fields: {
        valueItem: {} as unknown as typeof VALUE_ITEMS_ENTITY_1.fields.valueItem,
      },
    });
    const result = transformEntityFields(ADMIN_SCHEMA, ['entity'], copy, IDENTITY_TRANSFORMER);
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.valueItem.type: Missing a Component type',
    );
  });

  test('error: string[] where string is expected', () => {
    const copy = copyEntity(STRINGS_ENTITY_1, {
      fields: {
        string: ['one', 'two'] as unknown as typeof STRINGS_ENTITY_1.fields.string,
      },
    });
    const result = transformEntityFields(ADMIN_SCHEMA, ['entity'], copy, IDENTITY_TRANSFORMER);
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.string: Expected single String, got a list',
    );
  });
});

describe('transformValueItem', () => {
  test('normalize value item: extra field', () => {
    const transformed = transformValueItem(
      ADMIN_SCHEMA,
      ['valueItem'],
      { type: 'NestedValueItem', child: null, string: null, extra: 'hello' },
      IDENTITY_TRANSFORMER,
    ).valueOrThrow();
    expect(transformed).toEqual({ type: 'NestedValueItem', child: null, string: null });
  });

  test('normalize value item: extra field with keepExtraFields', () => {
    const transformed = transformValueItem(
      ADMIN_SCHEMA,
      ['valueItem'],
      { type: 'NestedValueItem', child: null, string: null, extra: 'hello' },
      IDENTITY_TRANSFORMER,
      { keepExtraFields: true },
    ).valueOrThrow();
    expect(transformed).toEqual({
      type: 'NestedValueItem',
      child: null,
      string: null,
      extra: 'hello',
    });
  });

  test('error: invalid type name', () => {
    const transformed = transformValueItem(
      ADMIN_SCHEMA,
      ['valueItem'],
      { type: 'Invalid' },
      IDENTITY_TRANSFORMER,
    );
    expectErrorResult(
      transformed,
      ErrorType.BadRequest,
      'valueItem: Couldn’t find spec for value type Invalid',
    );
  });

  test('error: missing type', () => {
    const transformed = transformValueItem(
      ADMIN_SCHEMA,
      ['valueItem'],
      {} as Component,
      IDENTITY_TRANSFORMER,
    );
    expectErrorResult(
      transformed,
      ErrorType.BadRequest,
      'valueItem.type: Missing a component type',
    );
  });
});
