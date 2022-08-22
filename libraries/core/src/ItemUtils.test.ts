import { describe, expect, test } from 'vitest';
import { assertIsDefined } from './Asserts.js';
import {
  isEntityNameAsRequested,
  isFieldValueEqual,
  normalizeFieldValue,
  visitItemRecursively,
  visitorPathToString,
} from './ItemUtils.js';
import {
  createRichTextEntityNode,
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextNode,
  createRichTextValueItemNode,
} from './RichTextUtils.js';
import type { AdminFieldSpecification } from './Schema.js';
import { AdminSchema, FieldType } from './Schema.js';
import type { EntityLike, RichText, RichTextNode, ValueItem } from './Types.js';

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

function getEntityFieldSpec(schema: AdminSchema, entityType: string, fieldName: string) {
  const entitySpec = schema.getEntityTypeSpecification(entityType);
  assertIsDefined(entitySpec);
  const fieldSpec = schema.getEntityFieldSpecification(entitySpec, fieldName);
  assertIsDefined(fieldSpec);
  return fieldSpec;
}

function buildMockCallbacks<TVisitContext>() {
  const calls: unknown[] = [];
  return {
    calls,
    callbacks: {
      visitField: (
        path: Array<string | number>,
        fieldSpec: AdminFieldSpecification,
        data: unknown,
        visitContext: TVisitContext
      ) => {
        calls.push({
          action: 'visitField',
          fieldName: fieldSpec.name,
          path: visitorPathToString(path),
          value: data,
          visitContext,
        });
      },
      visitRichTextNode: (
        path: Array<string | number>,
        fieldSpec: AdminFieldSpecification,
        node: RichTextNode,
        visitContext: TVisitContext
      ) => {
        calls.push({
          action: 'visitRichTextNode',
          fieldName: fieldSpec.name,
          path: visitorPathToString(path),
          nodeType: node.type,
          visitContext,
        });
      },
      enterValueItem: (
        path: Array<string | number>,
        fieldSpec: AdminFieldSpecification,
        valueItem: ValueItem,
        visitContext: TVisitContext
      ) => {
        calls.push({
          action: 'enterValueItem',
          fieldName: fieldSpec.name,
          path: visitorPathToString(path),
          type: valueItem.type,
        });
        return visitContext;
      },
      enterList: (
        path: Array<string | number>,
        fieldSpec: AdminFieldSpecification,
        list: unknown[],
        visitContext: TVisitContext
      ) => {
        calls.push({
          action: 'enterList',
          fieldName: fieldSpec.name,
          length: list.length,
          path: visitorPathToString(path),
          visitContext,
        });
      },
      enterRichText: (
        path: Array<string | number>,
        fieldSpec: AdminFieldSpecification,
        richText: RichText,
        visitContext: TVisitContext
      ) => {
        calls.push({
          action: 'enterRichText',
          fieldName: fieldSpec.name,
          path: visitorPathToString(path),
        });
        return visitContext;
      },
    },
  };
}

describe('visitItemRecursively()', () => {
  test('no fields', () => {
    const schema = new AdminSchema({
      entityTypes: [{ name: 'Foo', adminOnly: false, fields: [] }],
      valueTypes: [],
    });
    const { calls, callbacks } = buildMockCallbacks();
    const entity: EntityLike = { info: { type: 'Foo' }, fields: {} };
    visitItemRecursively({
      schema,
      item: entity,
      ...callbacks,
      initialVisitContext: undefined,
    });
    expect(calls).toMatchInlineSnapshot('[]');
  });

  test('all field types', () => {
    const schema = new AdminSchema({
      entityTypes: [
        {
          name: 'Foo',
          adminOnly: false,
          fields: [
            { name: 'string', type: FieldType.String },
            { name: 'bar', type: FieldType.EntityType },
            { name: 'location', type: FieldType.Location },
            { name: 'valueOne', type: FieldType.ValueType },
          ],
        },
        {
          name: 'Bar',
          adminOnly: false,
          fields: [],
        },
      ],
      valueTypes: [
        {
          name: 'ValueOne',
          adminOnly: false,
          fields: [
            { name: 'string', type: FieldType.String },
            { name: 'location', type: FieldType.Location },
            { name: 'bar', type: FieldType.EntityType },
          ],
        },
      ],
    });
    const { calls, callbacks } = buildMockCallbacks();
    const entity: EntityLike = {
      info: { type: 'Foo' },
      fields: {
        string: 'Hello string',
        location: { lat: 55.60498, lng: 13.003822 },
        bar: { id: 'bar id 1' },
        valueOne: { type: 'ValueOne', string: 'value string', bar: { id: 'bar id 2' } },
      },
    };
    visitItemRecursively({
      schema,
      item: entity,
      ...callbacks,
      initialVisitContext: undefined,
    });
    expect(calls).toMatchInlineSnapshot(`
      [
        {
          "action": "visitField",
          "fieldName": "string",
          "path": "fields.string",
          "value": "Hello string",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "bar",
          "path": "fields.bar",
          "value": {
            "id": "bar id 1",
          },
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "location",
          "path": "fields.location",
          "value": {
            "lat": 55.60498,
            "lng": 13.003822,
          },
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "valueOne",
          "path": "fields.valueOne",
          "value": {
            "bar": {
              "id": "bar id 2",
            },
            "string": "value string",
            "type": "ValueOne",
          },
          "visitContext": undefined,
        },
        {
          "action": "enterValueItem",
          "fieldName": "valueOne",
          "path": "fields.valueOne",
          "type": "ValueOne",
        },
        {
          "action": "visitField",
          "fieldName": "string",
          "path": "fields.valueOne.string",
          "value": "value string",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "bar",
          "path": "fields.valueOne.bar",
          "value": {
            "id": "bar id 2",
          },
          "visitContext": undefined,
        },
      ]
    `);
  });

  test('all list types', () => {
    const schema = new AdminSchema({
      entityTypes: [
        {
          name: 'Foo',
          adminOnly: false,
          fields: [
            { name: 'strings', type: FieldType.String, list: true },
            { name: 'locations', type: FieldType.Location, list: true },
            { name: 'bars', type: FieldType.EntityType, list: true },
            { name: 'valueOnes', type: FieldType.ValueType, list: true },
          ],
        },
        {
          name: 'Bar',
          adminOnly: false,
          fields: [],
        },
      ],
      valueTypes: [
        {
          name: 'ValueOne',
          adminOnly: false,
          fields: [
            { name: 'strings', type: FieldType.String, list: true },
            { name: 'bars', type: FieldType.EntityType, list: true },
          ],
        },
      ],
    });
    const { calls, callbacks } = buildMockCallbacks();
    const entity: EntityLike = {
      info: { type: 'Foo' },
      fields: {
        strings: ['Hello string', 'World string'],
        locations: [{ lat: 55.60498, lng: 13.003822 }],
        bars: [{ id: 'bar id 1' }, { id: 'bar id 2' }],
        valueOnes: [
          {
            type: 'ValueOne',
            strings: ['One', 'Two'],
            bars: [{ id: 'bar id 3' }, { id: 'bar id 4' }],
          },
          {
            type: 'ValueOne',
            strings: ['First', 'Second'],
            bars: [{ id: 'bar id 5' }, { id: 'bar id 6' }],
          },
        ],
      },
    };
    visitItemRecursively({
      schema,
      item: entity,
      ...callbacks,
      initialVisitContext: undefined,
    });
    expect(calls).toMatchInlineSnapshot(`
      [
        {
          "action": "enterList",
          "fieldName": "strings",
          "length": 2,
          "path": "fields.strings",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "strings",
          "path": "fields.strings[0]",
          "value": "Hello string",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "strings",
          "path": "fields.strings[1]",
          "value": "World string",
          "visitContext": undefined,
        },
        {
          "action": "enterList",
          "fieldName": "locations",
          "length": 1,
          "path": "fields.locations",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "locations",
          "path": "fields.locations[0]",
          "value": {
            "lat": 55.60498,
            "lng": 13.003822,
          },
          "visitContext": undefined,
        },
        {
          "action": "enterList",
          "fieldName": "bars",
          "length": 2,
          "path": "fields.bars",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "bars",
          "path": "fields.bars[0]",
          "value": {
            "id": "bar id 1",
          },
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "bars",
          "path": "fields.bars[1]",
          "value": {
            "id": "bar id 2",
          },
          "visitContext": undefined,
        },
        {
          "action": "enterList",
          "fieldName": "valueOnes",
          "length": 2,
          "path": "fields.valueOnes",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "valueOnes",
          "path": "fields.valueOnes[0]",
          "value": {
            "bars": [
              {
                "id": "bar id 3",
              },
              {
                "id": "bar id 4",
              },
            ],
            "strings": [
              "One",
              "Two",
            ],
            "type": "ValueOne",
          },
          "visitContext": undefined,
        },
        {
          "action": "enterValueItem",
          "fieldName": "valueOnes",
          "path": "fields.valueOnes[0]",
          "type": "ValueOne",
        },
        {
          "action": "enterList",
          "fieldName": "strings",
          "length": 2,
          "path": "fields.valueOnes[0].strings",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "strings",
          "path": "fields.valueOnes[0].strings[0]",
          "value": "One",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "strings",
          "path": "fields.valueOnes[0].strings[1]",
          "value": "Two",
          "visitContext": undefined,
        },
        {
          "action": "enterList",
          "fieldName": "bars",
          "length": 2,
          "path": "fields.valueOnes[0].bars",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "bars",
          "path": "fields.valueOnes[0].bars[0]",
          "value": {
            "id": "bar id 3",
          },
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "bars",
          "path": "fields.valueOnes[0].bars[1]",
          "value": {
            "id": "bar id 4",
          },
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "valueOnes",
          "path": "fields.valueOnes[1]",
          "value": {
            "bars": [
              {
                "id": "bar id 5",
              },
              {
                "id": "bar id 6",
              },
            ],
            "strings": [
              "First",
              "Second",
            ],
            "type": "ValueOne",
          },
          "visitContext": undefined,
        },
        {
          "action": "enterValueItem",
          "fieldName": "valueOnes",
          "path": "fields.valueOnes[1]",
          "type": "ValueOne",
        },
        {
          "action": "enterList",
          "fieldName": "strings",
          "length": 2,
          "path": "fields.valueOnes[1].strings",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "strings",
          "path": "fields.valueOnes[1].strings[0]",
          "value": "First",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "strings",
          "path": "fields.valueOnes[1].strings[1]",
          "value": "Second",
          "visitContext": undefined,
        },
        {
          "action": "enterList",
          "fieldName": "bars",
          "length": 2,
          "path": "fields.valueOnes[1].bars",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "bars",
          "path": "fields.valueOnes[1].bars[0]",
          "value": {
            "id": "bar id 5",
          },
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "bars",
          "path": "fields.valueOnes[1].bars[1]",
          "value": {
            "id": "bar id 6",
          },
          "visitContext": undefined,
        },
      ]
    `);
  });

  test('rich text', () => {
    const schema = new AdminSchema({
      entityTypes: [
        {
          name: 'Foo',
          adminOnly: false,
          fields: [{ name: 'body', type: FieldType.RichText }],
        },
      ],
      valueTypes: [],
    });
    const { calls, callbacks } = buildMockCallbacks();
    const entity: EntityLike = {
      info: { type: 'Foo' },
      fields: {
        body: createRichTextRootNode([
          createRichTextParagraphNode([createRichTextTextNode('Hello world')]),
          createRichTextEntityNode({ id: 'bar id' }),
        ]),
      },
    };
    visitItemRecursively({
      schema,
      item: entity,
      ...callbacks,
      initialVisitContext: undefined,
    });
    expect(calls).toMatchInlineSnapshot(`
      [
        {
          "action": "visitField",
          "fieldName": "body",
          "path": "fields.body",
          "value": {
            "root": {
              "children": [
                {
                  "children": [
                    {
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "Hello world",
                      "type": "text",
                      "version": 1,
                    },
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "type": "paragraph",
                  "version": 1,
                },
                {
                  "reference": {
                    "id": "bar id",
                  },
                  "type": "entity",
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
          "visitContext": undefined,
        },
        {
          "action": "enterRichText",
          "fieldName": "body",
          "path": "fields.body",
        },
        {
          "action": "visitRichTextNode",
          "fieldName": "body",
          "nodeType": "root",
          "path": "fields.body",
          "visitContext": undefined,
        },
        {
          "action": "visitRichTextNode",
          "fieldName": "body",
          "nodeType": "paragraph",
          "path": "fields.body[0]",
          "visitContext": undefined,
        },
        {
          "action": "visitRichTextNode",
          "fieldName": "body",
          "nodeType": "text",
          "path": "fields.body[0][0]",
          "visitContext": undefined,
        },
        {
          "action": "visitRichTextNode",
          "fieldName": "body",
          "nodeType": "entity",
          "path": "fields.body[1]",
          "visitContext": undefined,
        },
      ]
    `);
  });

  test('rich text with nested value item', () => {
    const schema = new AdminSchema({
      entityTypes: [
        {
          name: 'Foo',
          adminOnly: false,
          fields: [{ name: 'body', type: FieldType.RichText }],
        },
      ],
      valueTypes: [
        {
          name: 'ValueOne',
          adminOnly: false,
          fields: [
            { name: 'string', type: FieldType.String },
            { name: 'location', type: FieldType.Location },
            { name: 'bar', type: FieldType.EntityType },
            { name: 'child', type: FieldType.ValueType },
          ],
        },
      ],
    });
    const { calls, callbacks } = buildMockCallbacks();
    const entity: EntityLike = {
      info: { type: 'Foo' },
      fields: {
        body: createRichTextRootNode([
          createRichTextValueItemNode({
            type: 'ValueOne',
            string: 'Hello',
            location: { lat: 55.60498, lng: 13.003822 },
            bar: { id: 'bar id' },
            child: { type: 'ValueOne', string: 'Nested' },
          }),
        ]),
      },
    };
    visitItemRecursively({
      schema,
      item: entity,
      ...callbacks,
      initialVisitContext: undefined,
    });
    expect(calls).toMatchInlineSnapshot(`
      [
        {
          "action": "visitField",
          "fieldName": "body",
          "path": "fields.body",
          "value": {
            "root": {
              "children": [
                {
                  "data": {
                    "bar": {
                      "id": "bar id",
                    },
                    "child": {
                      "string": "Nested",
                      "type": "ValueOne",
                    },
                    "location": {
                      "lat": 55.60498,
                      "lng": 13.003822,
                    },
                    "string": "Hello",
                    "type": "ValueOne",
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
          "visitContext": undefined,
        },
        {
          "action": "enterRichText",
          "fieldName": "body",
          "path": "fields.body",
        },
        {
          "action": "visitRichTextNode",
          "fieldName": "body",
          "nodeType": "root",
          "path": "fields.body",
          "visitContext": undefined,
        },
        {
          "action": "visitRichTextNode",
          "fieldName": "body",
          "nodeType": "valueItem",
          "path": "fields.body[0]",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "string",
          "path": "fields.body[0].string",
          "value": "Hello",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "location",
          "path": "fields.body[0].location",
          "value": {
            "lat": 55.60498,
            "lng": 13.003822,
          },
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "bar",
          "path": "fields.body[0].bar",
          "value": {
            "id": "bar id",
          },
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "child",
          "path": "fields.body[0].child",
          "value": {
            "string": "Nested",
            "type": "ValueOne",
          },
          "visitContext": undefined,
        },
        {
          "action": "enterValueItem",
          "fieldName": "child",
          "path": "fields.body[0].child",
          "type": "ValueOne",
        },
        {
          "action": "visitField",
          "fieldName": "string",
          "path": "fields.body[0].child.string",
          "value": "Nested",
          "visitContext": undefined,
        },
      ]
    `);
  });

  test('rich text list', () => {
    const schema = new AdminSchema({
      entityTypes: [
        {
          name: 'Foo',
          adminOnly: false,
          fields: [{ name: 'bodyList', type: FieldType.RichText, list: true }],
        },
      ],
      valueTypes: [],
    });
    const { calls, callbacks } = buildMockCallbacks();
    const entity: EntityLike = {
      info: { type: 'Foo' },
      fields: {
        bodyList: [
          createRichTextRootNode([
            createRichTextParagraphNode([createRichTextTextNode('First rich text item')]),
          ]),
          createRichTextRootNode([
            createRichTextParagraphNode([createRichTextTextNode('Second rich text item')]),
            createRichTextParagraphNode([
              createRichTextTextNode('Second paragraph in second rich text item'),
            ]),
          ]),
        ],
      },
    };
    visitItemRecursively({
      schema,
      item: entity,
      ...callbacks,
      initialVisitContext: undefined,
    });
    expect(calls).toMatchInlineSnapshot(`
      [
        {
          "action": "enterList",
          "fieldName": "bodyList",
          "length": 2,
          "path": "fields.bodyList",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "bodyList",
          "path": "fields.bodyList[0]",
          "value": {
            "root": {
              "children": [
                {
                  "children": [
                    {
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "First rich text item",
                      "type": "text",
                      "version": 1,
                    },
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "type": "paragraph",
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
          "visitContext": undefined,
        },
        {
          "action": "enterRichText",
          "fieldName": "bodyList",
          "path": "fields.bodyList[0]",
        },
        {
          "action": "visitRichTextNode",
          "fieldName": "bodyList",
          "nodeType": "root",
          "path": "fields.bodyList[0]",
          "visitContext": undefined,
        },
        {
          "action": "visitRichTextNode",
          "fieldName": "bodyList",
          "nodeType": "paragraph",
          "path": "fields.bodyList[0][0]",
          "visitContext": undefined,
        },
        {
          "action": "visitRichTextNode",
          "fieldName": "bodyList",
          "nodeType": "text",
          "path": "fields.bodyList[0][0][0]",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "bodyList",
          "path": "fields.bodyList[1]",
          "value": {
            "root": {
              "children": [
                {
                  "children": [
                    {
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "Second rich text item",
                      "type": "text",
                      "version": 1,
                    },
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "type": "paragraph",
                  "version": 1,
                },
                {
                  "children": [
                    {
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "Second paragraph in second rich text item",
                      "type": "text",
                      "version": 1,
                    },
                  ],
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "type": "paragraph",
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
          "visitContext": undefined,
        },
        {
          "action": "enterRichText",
          "fieldName": "bodyList",
          "path": "fields.bodyList[1]",
        },
        {
          "action": "visitRichTextNode",
          "fieldName": "bodyList",
          "nodeType": "root",
          "path": "fields.bodyList[1]",
          "visitContext": undefined,
        },
        {
          "action": "visitRichTextNode",
          "fieldName": "bodyList",
          "nodeType": "paragraph",
          "path": "fields.bodyList[1][0]",
          "visitContext": undefined,
        },
        {
          "action": "visitRichTextNode",
          "fieldName": "bodyList",
          "nodeType": "text",
          "path": "fields.bodyList[1][0][0]",
          "visitContext": undefined,
        },
        {
          "action": "visitRichTextNode",
          "fieldName": "bodyList",
          "nodeType": "paragraph",
          "path": "fields.bodyList[1][1]",
          "visitContext": undefined,
        },
        {
          "action": "visitRichTextNode",
          "fieldName": "bodyList",
          "nodeType": "text",
          "path": "fields.bodyList[1][1][0]",
          "visitContext": undefined,
        },
      ]
    `);
  });

  test('recursive value items', () => {
    const schema = new AdminSchema({
      entityTypes: [
        {
          name: 'Foo',
          adminOnly: false,
          fields: [
            { name: 'string', type: FieldType.String },
            { name: 'bar', type: FieldType.EntityType },
            { name: 'valueOne', type: FieldType.ValueType },
          ],
        },
      ],
      valueTypes: [
        {
          name: 'ValueOne',
          adminOnly: false,
          fields: [
            { name: 'string', type: FieldType.String },
            { name: 'valueOne', type: FieldType.ValueType },
          ],
        },
      ],
    });
    const { calls, callbacks } = buildMockCallbacks();
    const entity: EntityLike = {
      info: { type: 'Foo' },
      fields: {
        valueOne: {
          type: 'ValueOne',
          string: 'root',
          valueOne: {
            type: 'ValueOne',
            string: 'root->valueOne',
            valueOne: { type: 'ValueOne', string: 'root->valueOne->valueOne' },
          },
        },
      },
    };
    visitItemRecursively({
      schema,
      item: entity,
      ...callbacks,
      initialVisitContext: undefined,
    });
    expect(calls).toMatchInlineSnapshot(`
      [
        {
          "action": "visitField",
          "fieldName": "valueOne",
          "path": "fields.valueOne",
          "value": {
            "string": "root",
            "type": "ValueOne",
            "valueOne": {
              "string": "root->valueOne",
              "type": "ValueOne",
              "valueOne": {
                "string": "root->valueOne->valueOne",
                "type": "ValueOne",
              },
            },
          },
          "visitContext": undefined,
        },
        {
          "action": "enterValueItem",
          "fieldName": "valueOne",
          "path": "fields.valueOne",
          "type": "ValueOne",
        },
        {
          "action": "visitField",
          "fieldName": "string",
          "path": "fields.valueOne.string",
          "value": "root",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "valueOne",
          "path": "fields.valueOne.valueOne",
          "value": {
            "string": "root->valueOne",
            "type": "ValueOne",
            "valueOne": {
              "string": "root->valueOne->valueOne",
              "type": "ValueOne",
            },
          },
          "visitContext": undefined,
        },
        {
          "action": "enterValueItem",
          "fieldName": "valueOne",
          "path": "fields.valueOne.valueOne",
          "type": "ValueOne",
        },
        {
          "action": "visitField",
          "fieldName": "string",
          "path": "fields.valueOne.valueOne.string",
          "value": "root->valueOne",
          "visitContext": undefined,
        },
        {
          "action": "visitField",
          "fieldName": "valueOne",
          "path": "fields.valueOne.valueOne.valueOne",
          "value": {
            "string": "root->valueOne->valueOne",
            "type": "ValueOne",
          },
          "visitContext": undefined,
        },
        {
          "action": "enterValueItem",
          "fieldName": "valueOne",
          "path": "fields.valueOne.valueOne.valueOne",
          "type": "ValueOne",
        },
        {
          "action": "visitField",
          "fieldName": "string",
          "path": "fields.valueOne.valueOne.valueOne.string",
          "value": "root->valueOne->valueOne",
          "visitContext": undefined,
        },
      ]
    `);
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

describe('normalizeFieldValue()', () => {
  test('"" => null', () =>
    expect(normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'string'), '')).toEqual(
      null
    ));

  test('[] => null', () =>
    expect(normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'stringList'), [])).toBe(
      null
    ));

  test('[string, ""] => [string]', () =>
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'stringList'), ['hello', ''])
    ).toEqual(['hello']));

  test('[string] => [string] (no change)', () => {
    const fieldValue = ['hello', 'world'];
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'stringList'), fieldValue)
    ).toBe(fieldValue);
  });

  test('{string1:string,string2:""} => {string1:string,string2:null}', () =>
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'twoStrings'), {
        type: 'TwoStrings',
        string1: 'Hello',
        string2: '',
      })
    ).toEqual({ type: 'TwoStrings', string1: 'Hello', string2: null }));

  test('{string1:undefined} => {string1:null,string2:null}', () =>
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'twoStrings'), {
        type: 'TwoStrings',
        string1: undefined,
        // no string2
      })
    ).toEqual({ type: 'TwoStrings', string1: null, string2: null }));

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

  test('string undefined => undefined', () =>
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'string'), undefined)
    ).toBe(undefined));

  test('string[] undefined => undefined', () =>
    expect(
      normalizeFieldValue(schema, getEntityFieldSpec(schema, 'Foo', 'stringList'), undefined)
    ).toBe(undefined));

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
