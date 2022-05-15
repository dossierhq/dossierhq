import type { AdminItemTraverseNode } from '.';
import {
  AdminItemTraverseNodeType,
  AdminSchema,
  FieldType,
  RichTextBlockType,
  traverseAdminItem,
  visitorPathToString,
} from '.';

const schema = new AdminSchema({
  entityTypes: [
    {
      name: 'Foo',
      adminOnly: false,
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'stringList', type: FieldType.String, list: true },
        { name: 'twoStrings', type: FieldType.ValueType, valueTypes: ['TwoStrings'] },
        { name: 'richText', type: FieldType.RichText },
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

function collectTraverseNodes(generator: Generator<AdminItemTraverseNode>) {
  const result = [];
  for (const node of generator) {
    const path = visitorPathToString(node.path);
    switch (node.type) {
      case AdminItemTraverseNodeType.error:
        result.push({ type: node.type, path, message: node.message });
        break;
      case AdminItemTraverseNodeType.field:
        result.push({ type: node.type, path, value: node.value });
        break;
      case AdminItemTraverseNodeType.valueItem:
        result.push({ type: node.type, path, valueItem: node.valueItem });
        break;
      default: {
        result.push(node);
      }
    }
  }
  return result;
}

describe('traverseAdminItem', () => {
  test('Empty Foo entity', () => {
    const nodes = collectTraverseNodes(
      traverseAdminItem(schema, ['entity'], { info: { type: 'Foo' }, fields: {} })
    );
    expect(nodes).toMatchInlineSnapshot(`
      Array [
        Object {
          "path": "entity.fields.string",
          "type": "field",
          "value": undefined,
        },
        Object {
          "fieldSpec": Object {
            "name": "string",
            "type": "String",
          },
          "path": Array [
            "entity",
            "fields",
            "string",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        Object {
          "path": "entity.fields.stringList",
          "type": "field",
          "value": undefined,
        },
        Object {
          "path": "entity.fields.twoStrings",
          "type": "field",
          "value": undefined,
        },
        Object {
          "fieldSpec": Object {
            "name": "twoStrings",
            "type": "ValueType",
            "valueTypes": Array [
              "TwoStrings",
            ],
          },
          "path": Array [
            "entity",
            "fields",
            "twoStrings",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        Object {
          "path": "entity.fields.richText",
          "type": "field",
          "value": undefined,
        },
        Object {
          "fieldSpec": Object {
            "name": "richText",
            "type": "RichText",
          },
          "path": Array [
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

  test('Foo with two strings in list', () => {
    const nodes = collectTraverseNodes(
      traverseAdminItem(schema, ['entity'], {
        info: { type: 'Foo' },
        fields: { stringList: ['string1', 'string2'] },
      })
    );
    expect(nodes).toMatchInlineSnapshot(`
      Array [
        Object {
          "path": "entity.fields.string",
          "type": "field",
          "value": undefined,
        },
        Object {
          "fieldSpec": Object {
            "name": "string",
            "type": "String",
          },
          "path": Array [
            "entity",
            "fields",
            "string",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        Object {
          "path": "entity.fields.stringList",
          "type": "field",
          "value": Array [
            "string1",
            "string2",
          ],
        },
        Object {
          "fieldSpec": Object {
            "list": true,
            "name": "stringList",
            "type": "String",
          },
          "path": Array [
            "entity",
            "fields",
            "stringList",
            0,
          ],
          "type": "fieldItem",
          "value": "string1",
        },
        Object {
          "fieldSpec": Object {
            "list": true,
            "name": "stringList",
            "type": "String",
          },
          "path": Array [
            "entity",
            "fields",
            "stringList",
            1,
          ],
          "type": "fieldItem",
          "value": "string2",
        },
        Object {
          "path": "entity.fields.twoStrings",
          "type": "field",
          "value": undefined,
        },
        Object {
          "fieldSpec": Object {
            "name": "twoStrings",
            "type": "ValueType",
            "valueTypes": Array [
              "TwoStrings",
            ],
          },
          "path": Array [
            "entity",
            "fields",
            "twoStrings",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        Object {
          "path": "entity.fields.richText",
          "type": "field",
          "value": undefined,
        },
        Object {
          "fieldSpec": Object {
            "name": "richText",
            "type": "RichText",
          },
          "path": Array [
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

  test('Empty TwoStrings value item', () => {
    const nodes = collectTraverseNodes(
      traverseAdminItem(schema, ['valueItem'], { type: 'TwoStrings' })
    );
    expect(nodes).toMatchInlineSnapshot(`
      Array [
        Object {
          "path": "valueItem",
          "type": "valueItem",
          "valueItem": Object {
            "type": "TwoStrings",
          },
        },
        Object {
          "path": "valueItem.string1",
          "type": "field",
          "value": undefined,
        },
        Object {
          "fieldSpec": Object {
            "name": "string1",
            "type": "String",
          },
          "path": Array [
            "valueItem",
            "string1",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        Object {
          "path": "valueItem.string2",
          "type": "field",
          "value": undefined,
        },
        Object {
          "fieldSpec": Object {
            "name": "string2",
            "type": "String",
          },
          "path": Array [
            "valueItem",
            "string2",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
      ]
    `);
  });

  test('Foo entity with TwoStrings value item', () => {
    const nodes = collectTraverseNodes(
      traverseAdminItem(schema, ['entity'], {
        info: { type: 'Foo' },
        fields: {
          string: 'string1',
          stringList: ['string2.1', 'string2.2'],
          twoStrings: { type: 'TwoStrings', string1: 'two-1', string2: 'two-2' },
        },
      })
    );
    expect(nodes).toMatchInlineSnapshot(`
      Array [
        Object {
          "path": "entity.fields.string",
          "type": "field",
          "value": "string1",
        },
        Object {
          "fieldSpec": Object {
            "name": "string",
            "type": "String",
          },
          "path": Array [
            "entity",
            "fields",
            "string",
          ],
          "type": "fieldItem",
          "value": "string1",
        },
        Object {
          "path": "entity.fields.stringList",
          "type": "field",
          "value": Array [
            "string2.1",
            "string2.2",
          ],
        },
        Object {
          "fieldSpec": Object {
            "list": true,
            "name": "stringList",
            "type": "String",
          },
          "path": Array [
            "entity",
            "fields",
            "stringList",
            0,
          ],
          "type": "fieldItem",
          "value": "string2.1",
        },
        Object {
          "fieldSpec": Object {
            "list": true,
            "name": "stringList",
            "type": "String",
          },
          "path": Array [
            "entity",
            "fields",
            "stringList",
            1,
          ],
          "type": "fieldItem",
          "value": "string2.2",
        },
        Object {
          "path": "entity.fields.twoStrings",
          "type": "field",
          "value": Object {
            "string1": "two-1",
            "string2": "two-2",
            "type": "TwoStrings",
          },
        },
        Object {
          "fieldSpec": Object {
            "name": "twoStrings",
            "type": "ValueType",
            "valueTypes": Array [
              "TwoStrings",
            ],
          },
          "path": Array [
            "entity",
            "fields",
            "twoStrings",
          ],
          "type": "fieldItem",
          "value": Object {
            "string1": "two-1",
            "string2": "two-2",
            "type": "TwoStrings",
          },
        },
        Object {
          "path": "entity.fields.twoStrings",
          "type": "valueItem",
          "valueItem": Object {
            "string1": "two-1",
            "string2": "two-2",
            "type": "TwoStrings",
          },
        },
        Object {
          "path": "entity.fields.twoStrings.string1",
          "type": "field",
          "value": "two-1",
        },
        Object {
          "fieldSpec": Object {
            "name": "string1",
            "type": "String",
          },
          "path": Array [
            "entity",
            "fields",
            "twoStrings",
            "string1",
          ],
          "type": "fieldItem",
          "value": "two-1",
        },
        Object {
          "path": "entity.fields.twoStrings.string2",
          "type": "field",
          "value": "two-2",
        },
        Object {
          "fieldSpec": Object {
            "name": "string2",
            "type": "String",
          },
          "path": Array [
            "entity",
            "fields",
            "twoStrings",
            "string2",
          ],
          "type": "fieldItem",
          "value": "two-2",
        },
        Object {
          "path": "entity.fields.richText",
          "type": "field",
          "value": undefined,
        },
        Object {
          "fieldSpec": Object {
            "name": "richText",
            "type": "RichText",
          },
          "path": Array [
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

  test('Foo entity with rich text with TwoStrings value item', () => {
    const nodes = collectTraverseNodes(
      traverseAdminItem(schema, ['entity'], {
        info: { type: 'Foo' },
        fields: {
          richText: {
            blocks: [
              {
                type: RichTextBlockType.valueItem,
                data: { type: 'TwoStrings', string1: 'two-1', string2: 'two-2' },
              },
            ],
          },
        },
      })
    );
    expect(nodes).toMatchInlineSnapshot(`
      Array [
        Object {
          "path": "entity.fields.string",
          "type": "field",
          "value": undefined,
        },
        Object {
          "fieldSpec": Object {
            "name": "string",
            "type": "String",
          },
          "path": Array [
            "entity",
            "fields",
            "string",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        Object {
          "path": "entity.fields.stringList",
          "type": "field",
          "value": undefined,
        },
        Object {
          "path": "entity.fields.twoStrings",
          "type": "field",
          "value": undefined,
        },
        Object {
          "fieldSpec": Object {
            "name": "twoStrings",
            "type": "ValueType",
            "valueTypes": Array [
              "TwoStrings",
            ],
          },
          "path": Array [
            "entity",
            "fields",
            "twoStrings",
          ],
          "type": "fieldItem",
          "value": undefined,
        },
        Object {
          "path": "entity.fields.richText",
          "type": "field",
          "value": Object {
            "blocks": Array [
              Object {
                "data": Object {
                  "string1": "two-1",
                  "string2": "two-2",
                  "type": "TwoStrings",
                },
                "type": "valueItem",
              },
            ],
          },
        },
        Object {
          "fieldSpec": Object {
            "name": "richText",
            "type": "RichText",
          },
          "path": Array [
            "entity",
            "fields",
            "richText",
          ],
          "type": "fieldItem",
          "value": Object {
            "blocks": Array [
              Object {
                "data": Object {
                  "string1": "two-1",
                  "string2": "two-2",
                  "type": "TwoStrings",
                },
                "type": "valueItem",
              },
            ],
          },
        },
        Object {
          "path": "entity.fields.richText.blocks[0].data",
          "type": "valueItem",
          "valueItem": Object {
            "string1": "two-1",
            "string2": "two-2",
            "type": "TwoStrings",
          },
        },
        Object {
          "path": "entity.fields.richText.blocks[0].data.string1",
          "type": "field",
          "value": "two-1",
        },
        Object {
          "fieldSpec": Object {
            "name": "string1",
            "type": "String",
          },
          "path": Array [
            "entity",
            "fields",
            "richText",
            "blocks",
            0,
            "data",
            "string1",
          ],
          "type": "fieldItem",
          "value": "two-1",
        },
        Object {
          "path": "entity.fields.richText.blocks[0].data.string2",
          "type": "field",
          "value": "two-2",
        },
        Object {
          "fieldSpec": Object {
            "name": "string2",
            "type": "String",
          },
          "path": Array [
            "entity",
            "fields",
            "richText",
            "blocks",
            0,
            "data",
            "string2",
          ],
          "type": "fieldItem",
          "value": "two-2",
        },
      ]
    `);
  });
});
