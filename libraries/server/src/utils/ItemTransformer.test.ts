import {
  AdminSchemaWithMigrations,
  FieldType,
  createRichTextRootNode,
  createRichTextValueItemNode,
  isRichTextValueItemNode,
  isValueItemItemField,
  ok,
  visitorPathToString,
} from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import { transformEntity } from './ItemTransformer.js';

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
    richText: createRichTextRootNode([createRichTextValueItemNode({ type: 'NestedValueItem' })]),
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

describe('transformEntity', () => {
  test('identity', () => {
    const calls: unknown[][] = [];
    const transformed = transformEntity(ADMIN_SCHEMA, [], ENTITY_1, {
      transformField: (path, _fieldSpec, value) => {
        calls.push(['transformField', visitorPathToString(path)]);
        return ok(value);
      },
      transformFieldItem: (path, _fieldSpec, value) => {
        calls.push(['transformFieldItem', visitorPathToString(path)]);
        return ok(value);
      },
      transformRichTextNode: (path, _fieldSpec, node) => {
        calls.push(['transformRichTextNode', visitorPathToString(path)]);
        return ok(node);
      },
    }).valueOrThrow();
    expect(transformed).toBe(ENTITY_1);
    expect(calls).toMatchSnapshot();
  });

  test('delete all value items', () => {
    const transformed = transformEntity(ADMIN_SCHEMA, [], ENTITY_1, {
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
});
