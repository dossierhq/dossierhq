import { describe, expect, test } from 'vitest';
import type { ItemTraverseNode } from './ItemTraverser.js';
import { ItemTraverseNodeType, traverseEntity, traverseValueItem } from './ItemTraverser.js';
import { visitorPathToString } from './ItemUtils.js';
import { createRichTextRootNode, createRichTextValueItemNode } from './RichTextUtils.js';
import type { PublishedSchema } from './Schema.js';
import { AdminSchema, FieldType } from './Schema.js';

const adminSchema = new AdminSchema({
  entityTypes: [
    {
      name: 'Foo',
      adminOnly: false,
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'stringList', type: FieldType.String, list: true },
        { name: 'twoStrings', type: FieldType.ValueType, valueTypes: ['TwoStrings'] },
        { name: 'richText', type: FieldType.RichText },
        { name: 'adminOnlyString', type: FieldType.String, adminOnly: true },
      ],
    },
  ],
  valueTypes: [
    {
      name: 'TwoStrings',
      adminOnly: false,
      fields: [
        { name: 'string1', type: FieldType.String },
        { name: 'string2', type: FieldType.String },
      ],
    },
  ],
});

const publishedSchema = adminSchema.toPublishedSchema();

function collectTraverseNodes<TSchema extends AdminSchema | PublishedSchema>(
  generator: Generator<ItemTraverseNode<TSchema>>
) {
  const result = [];
  for (const node of generator) {
    const path = visitorPathToString(node.path);
    switch (node.type) {
      case ItemTraverseNodeType.error:
        result.push({ type: node.type, path, message: node.message });
        break;
      case ItemTraverseNodeType.field:
        result.push({ type: node.type, path, value: node.value });
        break;
      case ItemTraverseNodeType.valueItem:
        result.push({ type: node.type, path, valueItem: node.valueItem });
        break;
      default: {
        result.push(node);
      }
    }
  }
  return result;
}

describe('traverseEntity', () => {
  test('Empty Foo entity', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], { info: { type: 'Foo' }, fields: {} })
    );
    expect(nodes).toMatchInlineSnapshot(`
      [
        {
          "path": "entity.fields.string",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "name": "string",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "string",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        {
          "path": "entity.fields.stringList",
          "type": "field",
          "value": undefined,
        },
        {
          "path": "entity.fields.twoStrings",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "name": "twoStrings",
            "type": "ValueType",
            "valueTypes": [
              "TwoStrings",
            ],
          },
          "path": [
            "entity",
            "fields",
            "twoStrings",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        {
          "path": "entity.fields.richText",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "name": "richText",
            "type": "RichText",
          },
          "path": [
            "entity",
            "fields",
            "richText",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        {
          "path": "entity.fields.adminOnlyString",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "adminOnly": true,
            "name": "adminOnlyString",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "adminOnlyString",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
      ]
    `);
  });

  test('Foo with two strings in list', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'Foo' },
        fields: { stringList: ['string1', 'string2'] },
      })
    );
    expect(nodes).toMatchInlineSnapshot(`
      [
        {
          "path": "entity.fields.string",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "name": "string",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "string",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        {
          "path": "entity.fields.stringList",
          "type": "field",
          "value": [
            "string1",
            "string2",
          ],
        },
        {
          "fieldSpec": {
            "list": true,
            "name": "stringList",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "stringList",
            0,
          ],
          "type": "fieldItem",
          "value": "string1",
        },
        {
          "fieldSpec": {
            "list": true,
            "name": "stringList",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "stringList",
            1,
          ],
          "type": "fieldItem",
          "value": "string2",
        },
        {
          "path": "entity.fields.twoStrings",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "name": "twoStrings",
            "type": "ValueType",
            "valueTypes": [
              "TwoStrings",
            ],
          },
          "path": [
            "entity",
            "fields",
            "twoStrings",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        {
          "path": "entity.fields.richText",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "name": "richText",
            "type": "RichText",
          },
          "path": [
            "entity",
            "fields",
            "richText",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        {
          "path": "entity.fields.adminOnlyString",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "adminOnly": true,
            "name": "adminOnlyString",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "adminOnlyString",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
      ]
    `);
  });

  test('Foo entity with TwoStrings value item', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'Foo' },
        fields: {
          string: 'string1',
          stringList: ['string2.1', 'string2.2'],
          twoStrings: { type: 'TwoStrings', string1: 'two-1', string2: 'two-2' },
        },
      })
    );
    expect(nodes).toMatchInlineSnapshot(`
      [
        {
          "path": "entity.fields.string",
          "type": "field",
          "value": "string1",
        },
        {
          "fieldSpec": {
            "name": "string",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "string",
          ],
          "type": "fieldItem",
          "value": "string1",
        },
        {
          "path": "entity.fields.stringList",
          "type": "field",
          "value": [
            "string2.1",
            "string2.2",
          ],
        },
        {
          "fieldSpec": {
            "list": true,
            "name": "stringList",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "stringList",
            0,
          ],
          "type": "fieldItem",
          "value": "string2.1",
        },
        {
          "fieldSpec": {
            "list": true,
            "name": "stringList",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "stringList",
            1,
          ],
          "type": "fieldItem",
          "value": "string2.2",
        },
        {
          "path": "entity.fields.twoStrings",
          "type": "field",
          "value": {
            "string1": "two-1",
            "string2": "two-2",
            "type": "TwoStrings",
          },
        },
        {
          "fieldSpec": {
            "name": "twoStrings",
            "type": "ValueType",
            "valueTypes": [
              "TwoStrings",
            ],
          },
          "path": [
            "entity",
            "fields",
            "twoStrings",
          ],
          "type": "fieldItem",
          "value": {
            "string1": "two-1",
            "string2": "two-2",
            "type": "TwoStrings",
          },
        },
        {
          "path": "entity.fields.twoStrings",
          "type": "valueItem",
          "valueItem": {
            "string1": "two-1",
            "string2": "two-2",
            "type": "TwoStrings",
          },
        },
        {
          "path": "entity.fields.twoStrings.string1",
          "type": "field",
          "value": "two-1",
        },
        {
          "fieldSpec": {
            "name": "string1",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "twoStrings",
            "string1",
          ],
          "type": "fieldItem",
          "value": "two-1",
        },
        {
          "path": "entity.fields.twoStrings.string2",
          "type": "field",
          "value": "two-2",
        },
        {
          "fieldSpec": {
            "name": "string2",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "twoStrings",
            "string2",
          ],
          "type": "fieldItem",
          "value": "two-2",
        },
        {
          "path": "entity.fields.richText",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "name": "richText",
            "type": "RichText",
          },
          "path": [
            "entity",
            "fields",
            "richText",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        {
          "path": "entity.fields.adminOnlyString",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "adminOnly": true,
            "name": "adminOnlyString",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "adminOnlyString",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
      ]
    `);
  });

  test('Foo entity with rich text with TwoStrings value item', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'Foo' },
        fields: {
          richText: createRichTextRootNode([
            createRichTextValueItemNode({ type: 'TwoStrings', string1: 'two-1', string2: 'two-2' }),
          ]),
        },
      })
    );
    expect(nodes).toMatchInlineSnapshot(`
      [
        {
          "path": "entity.fields.string",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "name": "string",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "string",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        {
          "path": "entity.fields.stringList",
          "type": "field",
          "value": undefined,
        },
        {
          "path": "entity.fields.twoStrings",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "name": "twoStrings",
            "type": "ValueType",
            "valueTypes": [
              "TwoStrings",
            ],
          },
          "path": [
            "entity",
            "fields",
            "twoStrings",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        {
          "path": "entity.fields.richText",
          "type": "field",
          "value": {
            "root": {
              "children": [
                {
                  "data": {
                    "string1": "two-1",
                    "string2": "two-2",
                    "type": "TwoStrings",
                  },
                  "type": "valueItem",
                  "version": 1,
                },
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "type": "root",
              "version": 1,
            },
          },
        },
        {
          "fieldSpec": {
            "name": "richText",
            "type": "RichText",
          },
          "path": [
            "entity",
            "fields",
            "richText",
          ],
          "type": "fieldItem",
          "value": {
            "root": {
              "children": [
                {
                  "data": {
                    "string1": "two-1",
                    "string2": "two-2",
                    "type": "TwoStrings",
                  },
                  "type": "valueItem",
                  "version": 1,
                },
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "type": "root",
              "version": 1,
            },
          },
        },
        {
          "fieldSpec": {
            "name": "richText",
            "type": "RichText",
          },
          "node": {
            "children": [
              {
                "data": {
                  "string1": "two-1",
                  "string2": "two-2",
                  "type": "TwoStrings",
                },
                "type": "valueItem",
                "version": 1,
              },
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "root",
            "version": 1,
          },
          "path": [
            "entity",
            "fields",
            "richText",
          ],
          "type": "richTextNode",
        },
        {
          "fieldSpec": {
            "name": "richText",
            "type": "RichText",
          },
          "node": {
            "data": {
              "string1": "two-1",
              "string2": "two-2",
              "type": "TwoStrings",
            },
            "type": "valueItem",
            "version": 1,
          },
          "path": [
            "entity",
            "fields",
            "richText",
            0,
          ],
          "type": "richTextNode",
        },
        {
          "path": "entity.fields.richText[0].data",
          "type": "valueItem",
          "valueItem": {
            "string1": "two-1",
            "string2": "two-2",
            "type": "TwoStrings",
          },
        },
        {
          "path": "entity.fields.richText[0].data.string1",
          "type": "field",
          "value": "two-1",
        },
        {
          "fieldSpec": {
            "name": "string1",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "richText",
            0,
            "data",
            "string1",
          ],
          "type": "fieldItem",
          "value": "two-1",
        },
        {
          "path": "entity.fields.richText[0].data.string2",
          "type": "field",
          "value": "two-2",
        },
        {
          "fieldSpec": {
            "name": "string2",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "richText",
            0,
            "data",
            "string2",
          ],
          "type": "fieldItem",
          "value": "two-2",
        },
        {
          "path": "entity.fields.adminOnlyString",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "adminOnly": true,
            "name": "adminOnlyString",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "adminOnlyString",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
      ]
    `);
  });

  test('Foo with adminOnly field (published)', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(publishedSchema, ['entity'], {
        info: { type: 'Foo' },
        fields: { adminOnlyString: 'Hello admin only' },
      })
    );
    expect(nodes).toMatchInlineSnapshot(`
      [
        {
          "path": "entity.fields.string",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "name": "string",
            "type": "String",
          },
          "path": [
            "entity",
            "fields",
            "string",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        {
          "path": "entity.fields.stringList",
          "type": "field",
          "value": undefined,
        },
        {
          "path": "entity.fields.twoStrings",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "name": "twoStrings",
            "type": "ValueType",
            "valueTypes": [
              "TwoStrings",
            ],
          },
          "path": [
            "entity",
            "fields",
            "twoStrings",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        {
          "path": "entity.fields.richText",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "name": "richText",
            "type": "RichText",
          },
          "path": [
            "entity",
            "fields",
            "richText",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
      ]
    `);
  });
});

describe('traverseValueItem', () => {
  test('Empty TwoStrings value item', () => {
    const nodes = collectTraverseNodes(
      traverseValueItem(adminSchema, ['valueItem'], { type: 'TwoStrings' })
    );
    expect(nodes).toMatchInlineSnapshot(`
      [
        {
          "path": "valueItem",
          "type": "valueItem",
          "valueItem": {
            "type": "TwoStrings",
          },
        },
        {
          "path": "valueItem.string1",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "name": "string1",
            "type": "String",
          },
          "path": [
            "valueItem",
            "string1",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        {
          "path": "valueItem.string2",
          "type": "field",
          "value": undefined,
        },
        {
          "fieldSpec": {
            "name": "string2",
            "type": "String",
          },
          "path": [
            "valueItem",
            "string2",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
      ]
    `);
  });
});
