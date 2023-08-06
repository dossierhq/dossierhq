import { describe, expect, test } from 'vitest';
import { ErrorType, ok } from '../ErrorResult.js';
import { createRichText, createRichTextValueItemNode } from '../content/RichTextUtils.js';
import { AdminSchemaWithMigrations, type AdminSchema } from '../schema/AdminSchema.js';
import { FieldType } from '../schema/SchemaSpecification.js';
import { expectErrorResult } from '../test/CoreTestUtils.js';
import { contentValuePathToString } from './ContentPath.js';
import { transformEntityFields, type ContentTransformer } from './ContentTransformer.js';
import { isRichTextValueItemNode, isValueItemItemField } from './ContentTypeUtils.js';
import { copyEntity } from './ContentUtils.js';

const ADMIN_SCHEMA = AdminSchemaWithMigrations.createAndValidate({
  entityTypes: [
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

const ENTITY_1 = Object.freeze({
  info: { type: 'ValueItemsEntity' },
  fields: {
    richText: createRichText([createRichTextValueItemNode({ type: 'NestedValueItem' })]),
    valueItem: {
      type: 'NestedValueItem',
      string: '1',
      child: { type: 'NestedValueItem', string: '1.1' },
    },
    valueItemList: [
      { type: 'NestedValueItem', string: '1' },
      { type: 'NestedValueItem', string: '2' },
    ],
  },
});

const IDENTITY_TRANSFORMER: ContentTransformer<AdminSchema, typeof ErrorType.Generic> = {
  transformField: (path, _fieldSpec, value) => ok(value),
  transformFieldItem: (path, _fieldSpec, value) => ok(value),
  transformRichTextNode: (path, _fieldSpec, node) => ok(node),
};

describe('transformEntity', () => {
  test('identity', () => {
    const calls: unknown[][] = [];
    const transformed = transformEntityFields(ADMIN_SCHEMA, [], ENTITY_1, {
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
    expect(transformed).toBe(ENTITY_1.fields);
    expect(calls).toMatchSnapshot();
  });

  test('delete all value items', () => {
    const transformed = transformEntityFields(ADMIN_SCHEMA, [], ENTITY_1, {
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

  test('error: use unsupported field name in entity', () => {
    const copy = copyEntity(ENTITY_1, {
      fields: { unsupported: 'hello' } as Partial<typeof ENTITY_1.fields>,
    });
    const result = transformEntityFields(ADMIN_SCHEMA, ['entity'], copy, IDENTITY_TRANSFORMER);
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity: ValueItemsEntity does not include the fields: unsupported',
    );
  });

  test('error: use unsupported field name in value item', () => {
    const copy = copyEntity(ENTITY_1, {
      fields: {
        valueItem: {
          type: 'NestedValueItem',
          unsupported: 'hello',
        } as unknown as typeof ENTITY_1.fields.valueItem,
      },
    });
    const result = transformEntityFields(ADMIN_SCHEMA, ['entity'], copy, IDENTITY_TRANSFORMER);
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.valueItem: NestedValueItem does not include the fields: unsupported',
    );
  });
});
