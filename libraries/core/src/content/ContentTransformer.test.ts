import { describe, expect, test } from 'vitest';
import { ErrorType, ok } from '../ErrorResult.js';
import type { ValueItem } from '../Types.js';
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
import { isRichTextValueItemNode, isValueItemItemField } from './ContentTypeUtils.js';
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
        { name: 'valueItem', type: FieldType.ValueItem },
        { name: 'valueItemList', type: FieldType.ValueItem, list: true },
      ],
    },
  ],
  valueTypes: [
    {
      name: 'NestedValueItem',
      fields: [
        { name: 'child', type: FieldType.ValueItem },
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
      transformField: (path, _fieldSpec, value) => {
        calls.push(['transformField', contentValuePathToString(path)]);
        return ok(value);
      },
      transformFieldItem: (path, _fieldSpec, value) => {
        calls.push(['transformFieldItem', contentValuePathToString(path)]);
        return ok(value);
      },
      transformRichTextNode: (path, _fieldSpec, node) => {
        calls.push(['transformRichTextNode', contentValuePathToString(path)]);
        return ok(node);
      },
    }).valueOrThrow();
    expect(transformed).toBe(VALUE_ITEMS_ENTITY_1.fields);
    expect(calls).toMatchSnapshot();
  });

  test('delete all value items', () => {
    const transformed = transformEntityFields(ADMIN_SCHEMA, [], VALUE_ITEMS_ENTITY_1, {
      transformField: (_path, _fieldSpec, value) => ok(value),
      transformFieldItem: (_path, fieldSpec, value) => {
        if (isValueItemItemField(fieldSpec, value)) return ok(null);
        return ok(value);
      },
      transformRichTextNode: (_path, _fieldSpec, node) =>
        ok(isRichTextValueItemNode(node) ? null : node),
    }).valueOrThrow();
    expect(transformed).toMatchSnapshot();
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

  test('error: use unsupported field name in entity', () => {
    const result = transformEntityFields(
      ADMIN_SCHEMA,
      ['entity'],
      copyEntity(VALUE_ITEMS_ENTITY_1, {
        fields: { unsupported: 'hello' } as Partial<typeof VALUE_ITEMS_ENTITY_1.fields>,
      }),
      IDENTITY_TRANSFORMER,
    );
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity: ValueItemsEntity does not include the fields: unsupported',
    );
  });

  test('error: missing type in value item', () => {
    const copy = copyEntity(VALUE_ITEMS_ENTITY_1, {
      fields: {
        valueItem: {} as unknown as typeof VALUE_ITEMS_ENTITY_1.fields.valueItem,
      },
    });
    const result = transformEntityFields(ADMIN_SCHEMA, ['entity'], copy, IDENTITY_TRANSFORMER);
    expectErrorResult(result, ErrorType.BadRequest, 'entity.valueItem: Value item has no type');
  });

  test('error: use unsupported field name in value item', () => {
    const copy = copyEntity(VALUE_ITEMS_ENTITY_1, {
      fields: {
        valueItem: {
          type: 'NestedValueItem',
          unsupported: 'hello',
        } as unknown as typeof VALUE_ITEMS_ENTITY_1.fields.valueItem,
      },
    });
    const result = transformEntityFields(ADMIN_SCHEMA, ['entity'], copy, IDENTITY_TRANSFORMER);
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.valueItem: NestedValueItem does not include the fields: unsupported',
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
      {} as ValueItem,
      IDENTITY_TRANSFORMER,
    );
    expectErrorResult(transformed, ErrorType.BadRequest, 'valueItem: Value item has no type');
  });
});
