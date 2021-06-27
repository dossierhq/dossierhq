import type { Entity, FieldSpecification, RichText, RichTextBlock, ValueItem } from '.';
import { FieldType, RichTextBlockType, Schema, visitItemRecursively, visitorPathToString } from '.';

function buildMockCallbacks<TVisitContext>() {
  const calls: unknown[] = [];
  return {
    calls,
    callbacks: {
      visitField: (
        path: Array<string | number>,
        fieldSpec: FieldSpecification,
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
      visitRichTextBlock: (
        path: Array<string | number>,
        fieldSpec: FieldSpecification,
        block: RichTextBlock,
        visitContext: TVisitContext
      ) => {
        calls.push({
          action: 'visitRichTextBlock',
          fieldName: fieldSpec.name,
          path: visitorPathToString(path),
          blockType: block.type,
          blockData: block.data,
          visitContext,
        });
      },
      enterValueItem: (
        path: Array<string | number>,
        fieldSpec: FieldSpecification,
        valueItem: ValueItem,
        visitContext: TVisitContext
      ) => {
        calls.push({
          action: 'enterValueItem',
          fieldName: fieldSpec.name,
          path: visitorPathToString(path),
          type: valueItem._type,
        });
        return visitContext;
      },
      enterList: (
        path: Array<string | number>,
        fieldSpec: FieldSpecification,
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
        fieldSpec: FieldSpecification,
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
    const schema = new Schema({ entityTypes: [{ name: 'Foo', fields: [] }], valueTypes: [] });
    const { calls, callbacks } = buildMockCallbacks();
    const entity: Entity = { id: 'id1', info: { type: 'Foo', name: 'hello' }, fields: {} };
    visitItemRecursively({
      schema,
      item: entity,
      ...callbacks,
      initialVisitContext: undefined,
    });
    expect(calls).toMatchInlineSnapshot(`Array []`);
  });

  test('all field types', () => {
    const schema = new Schema({
      entityTypes: [
        {
          name: 'Foo',
          fields: [
            { name: 'string', type: FieldType.String },
            { name: 'bar', type: FieldType.EntityType },
            { name: 'location', type: FieldType.Location },
            { name: 'valueOne', type: FieldType.ValueType },
          ],
        },
        {
          name: 'Bar',
          fields: [],
        },
      ],
      valueTypes: [
        {
          name: 'ValueOne',
          fields: [
            { name: 'string', type: FieldType.String },
            { name: 'location', type: FieldType.Location },
            { name: 'bar', type: FieldType.EntityType },
          ],
        },
      ],
    });
    const { calls, callbacks } = buildMockCallbacks();
    const entity: Entity = {
      id: 'id1',
      info: {
        type: 'Foo',
        name: 'hello',
      },
      fields: {
        string: 'Hello string',
        location: { lat: 55.60498, lng: 13.003822 },
        bar: { id: 'bar id 1' },
        valueOne: { _type: 'ValueOne', string: 'value string', bar: { id: 'bar id 2' } },
      },
    };
    visitItemRecursively({
      schema,
      item: entity,
      ...callbacks,
      initialVisitContext: undefined,
    });
    expect(calls).toMatchInlineSnapshot(`
      Array [
        Object {
          "action": "visitField",
          "fieldName": "string",
          "path": "string",
          "value": "Hello string",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bar",
          "path": "bar",
          "value": Object {
            "id": "bar id 1",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "location",
          "path": "location",
          "value": Object {
            "lat": 55.60498,
            "lng": 13.003822,
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "valueOne",
          "path": "valueOne",
          "value": Object {
            "_type": "ValueOne",
            "bar": Object {
              "id": "bar id 2",
            },
            "string": "value string",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterValueItem",
          "fieldName": "valueOne",
          "path": "valueOne",
          "type": "ValueOne",
        },
        Object {
          "action": "visitField",
          "fieldName": "string",
          "path": "valueOne.string",
          "value": "value string",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bar",
          "path": "valueOne.bar",
          "value": Object {
            "id": "bar id 2",
          },
          "visitContext": undefined,
        },
      ]
    `);
  });

  test('all list types', () => {
    const schema = new Schema({
      entityTypes: [
        {
          name: 'Foo',
          fields: [
            { name: 'strings', type: FieldType.String, list: true },
            { name: 'locations', type: FieldType.Location, list: true },
            { name: 'bars', type: FieldType.EntityType, list: true },
            { name: 'valueOnes', type: FieldType.ValueType, list: true },
          ],
        },
        {
          name: 'Bar',
          fields: [],
        },
      ],
      valueTypes: [
        {
          name: 'ValueOne',
          fields: [
            { name: 'strings', type: FieldType.String, list: true },
            { name: 'bars', type: FieldType.EntityType, list: true },
          ],
        },
      ],
    });
    const { calls, callbacks } = buildMockCallbacks();
    const entity: Entity = {
      id: 'id1',
      info: {
        type: 'Foo',
        name: 'hello',
      },
      fields: {
        strings: ['Hello string', 'World string'],
        locations: [{ lat: 55.60498, lng: 13.003822 }],
        bars: [{ id: 'bar id 1' }, { id: 'bar id 2' }],
        valueOnes: [
          {
            _type: 'ValueOne',
            strings: ['One', 'Two'],
            bars: [{ id: 'bar id 3' }, { id: 'bar id 4' }],
          },
          {
            _type: 'ValueOne',
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
      Array [
        Object {
          "action": "enterList",
          "fieldName": "strings",
          "length": 2,
          "path": "strings",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "path": "strings[0]",
          "value": "Hello string",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "path": "strings[1]",
          "value": "World string",
          "visitContext": undefined,
        },
        Object {
          "action": "enterList",
          "fieldName": "locations",
          "length": 1,
          "path": "locations",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "locations",
          "path": "locations[0]",
          "value": Object {
            "lat": 55.60498,
            "lng": 13.003822,
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterList",
          "fieldName": "bars",
          "length": 2,
          "path": "bars",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "path": "bars[0]",
          "value": Object {
            "id": "bar id 1",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "path": "bars[1]",
          "value": Object {
            "id": "bar id 2",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterList",
          "fieldName": "valueOnes",
          "length": 2,
          "path": "valueOnes",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "valueOnes",
          "path": "valueOnes[0]",
          "value": Object {
            "_type": "ValueOne",
            "bars": Array [
              Object {
                "id": "bar id 3",
              },
              Object {
                "id": "bar id 4",
              },
            ],
            "strings": Array [
              "One",
              "Two",
            ],
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterValueItem",
          "fieldName": "valueOnes",
          "path": "valueOnes[0]",
          "type": "ValueOne",
        },
        Object {
          "action": "enterList",
          "fieldName": "strings",
          "length": 2,
          "path": "valueOnes[0].strings",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "path": "valueOnes[0].strings[0]",
          "value": "One",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "path": "valueOnes[0].strings[1]",
          "value": "Two",
          "visitContext": undefined,
        },
        Object {
          "action": "enterList",
          "fieldName": "bars",
          "length": 2,
          "path": "valueOnes[0].bars",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "path": "valueOnes[0].bars[0]",
          "value": Object {
            "id": "bar id 3",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "path": "valueOnes[0].bars[1]",
          "value": Object {
            "id": "bar id 4",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "valueOnes",
          "path": "valueOnes[1]",
          "value": Object {
            "_type": "ValueOne",
            "bars": Array [
              Object {
                "id": "bar id 5",
              },
              Object {
                "id": "bar id 6",
              },
            ],
            "strings": Array [
              "First",
              "Second",
            ],
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterValueItem",
          "fieldName": "valueOnes",
          "path": "valueOnes[1]",
          "type": "ValueOne",
        },
        Object {
          "action": "enterList",
          "fieldName": "strings",
          "length": 2,
          "path": "valueOnes[1].strings",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "path": "valueOnes[1].strings[0]",
          "value": "First",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "path": "valueOnes[1].strings[1]",
          "value": "Second",
          "visitContext": undefined,
        },
        Object {
          "action": "enterList",
          "fieldName": "bars",
          "length": 2,
          "path": "valueOnes[1].bars",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "path": "valueOnes[1].bars[0]",
          "value": Object {
            "id": "bar id 5",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "path": "valueOnes[1].bars[1]",
          "value": Object {
            "id": "bar id 6",
          },
          "visitContext": undefined,
        },
      ]
    `);
  });

  test('rich text', () => {
    const schema = new Schema({
      entityTypes: [
        {
          name: 'Foo',
          fields: [{ name: 'body', type: FieldType.RichText }],
        },
      ],
      valueTypes: [],
    });
    const { calls, callbacks } = buildMockCallbacks();
    const entity: Entity = {
      id: 'id1',
      info: {
        type: 'Foo',
        name: 'hello',
      },
      fields: {
        body: {
          blocks: [
            { type: RichTextBlockType.paragraph, data: { text: 'Hello world' } },
            { type: 'randomType', data: { value: 'Random' } },
            { type: RichTextBlockType.entity, data: { id: 'bar id' } },
          ],
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
      Array [
        Object {
          "action": "visitField",
          "fieldName": "body",
          "path": "body",
          "value": Object {
            "blocks": Array [
              Object {
                "data": Object {
                  "text": "Hello world",
                },
                "type": "paragraph",
              },
              Object {
                "data": Object {
                  "value": "Random",
                },
                "type": "randomType",
              },
              Object {
                "data": Object {
                  "id": "bar id",
                },
                "type": "entity",
              },
            ],
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterRichText",
          "fieldName": "body",
          "path": "body",
        },
        Object {
          "action": "visitRichTextBlock",
          "blockData": Object {
            "text": "Hello world",
          },
          "blockType": "paragraph",
          "fieldName": "body",
          "path": "body[0]",
          "visitContext": undefined,
        },
        Object {
          "action": "visitRichTextBlock",
          "blockData": Object {
            "value": "Random",
          },
          "blockType": "randomType",
          "fieldName": "body",
          "path": "body[1]",
          "visitContext": undefined,
        },
        Object {
          "action": "visitRichTextBlock",
          "blockData": Object {
            "id": "bar id",
          },
          "blockType": "entity",
          "fieldName": "body",
          "path": "body[2]",
          "visitContext": undefined,
        },
      ]
    `);
  });

  test('rich text with nested value item', () => {
    const schema = new Schema({
      entityTypes: [
        {
          name: 'Foo',
          fields: [{ name: 'body', type: FieldType.RichText }],
        },
      ],
      valueTypes: [
        {
          name: 'ValueOne',
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
    const entity: Entity = {
      id: 'id1',
      info: { type: 'Foo', name: 'hello' },
      fields: {
        body: {
          blocks: [
            {
              type: RichTextBlockType.valueItem,
              data: {
                _type: 'ValueOne',
                string: 'Hello',
                location: { lat: 55.60498, lng: 13.003822 },
                bar: { id: 'bar id' },
                child: { _type: 'ValueOne', string: 'Nested' },
              },
            },
          ],
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
      Array [
        Object {
          "action": "visitField",
          "fieldName": "body",
          "path": "body",
          "value": Object {
            "blocks": Array [
              Object {
                "data": Object {
                  "_type": "ValueOne",
                  "bar": Object {
                    "id": "bar id",
                  },
                  "child": Object {
                    "_type": "ValueOne",
                    "string": "Nested",
                  },
                  "location": Object {
                    "lat": 55.60498,
                    "lng": 13.003822,
                  },
                  "string": "Hello",
                },
                "type": "valueItem",
              },
            ],
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterRichText",
          "fieldName": "body",
          "path": "body",
        },
        Object {
          "action": "visitRichTextBlock",
          "blockData": Object {
            "_type": "ValueOne",
            "bar": Object {
              "id": "bar id",
            },
            "child": Object {
              "_type": "ValueOne",
              "string": "Nested",
            },
            "location": Object {
              "lat": 55.60498,
              "lng": 13.003822,
            },
            "string": "Hello",
          },
          "blockType": "valueItem",
          "fieldName": "body",
          "path": "body[0]",
          "visitContext": undefined,
        },
        Object {
          "action": "enterValueItem",
          "fieldName": "body",
          "path": "body",
          "type": "ValueOne",
        },
        Object {
          "action": "visitField",
          "fieldName": "string",
          "path": "body[0].string",
          "value": "Hello",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "location",
          "path": "body[0].location",
          "value": Object {
            "lat": 55.60498,
            "lng": 13.003822,
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bar",
          "path": "body[0].bar",
          "value": Object {
            "id": "bar id",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "child",
          "path": "body[0].child",
          "value": Object {
            "_type": "ValueOne",
            "string": "Nested",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterValueItem",
          "fieldName": "child",
          "path": "body[0].child",
          "type": "ValueOne",
        },
        Object {
          "action": "visitField",
          "fieldName": "string",
          "path": "body[0].child.string",
          "value": "Nested",
          "visitContext": undefined,
        },
      ]
    `);
  });

  test('rich text list', () => {
    const schema = new Schema({
      entityTypes: [
        {
          name: 'Foo',
          fields: [{ name: 'bodyList', type: FieldType.RichText, list: true }],
        },
      ],
      valueTypes: [],
    });
    const { calls, callbacks } = buildMockCallbacks();
    const entity: Entity = {
      id: 'id1',
      info: { type: 'Foo', name: 'hello' },
      fields: {
        bodyList: [
          {
            blocks: [{ type: RichTextBlockType.paragraph, data: { text: 'First rich text item' } }],
          },
          {
            blocks: [
              { type: RichTextBlockType.paragraph, data: { text: 'Second rich text item' } },
              {
                type: RichTextBlockType.paragraph,
                data: { text: 'Second block in second rich text item' },
              },
            ],
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
      Array [
        Object {
          "action": "enterList",
          "fieldName": "bodyList",
          "length": 2,
          "path": "bodyList",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bodyList",
          "path": "bodyList[0]",
          "value": Object {
            "blocks": Array [
              Object {
                "data": Object {
                  "text": "First rich text item",
                },
                "type": "paragraph",
              },
            ],
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterRichText",
          "fieldName": "bodyList",
          "path": "bodyList[0]",
        },
        Object {
          "action": "visitRichTextBlock",
          "blockData": Object {
            "text": "First rich text item",
          },
          "blockType": "paragraph",
          "fieldName": "bodyList",
          "path": "bodyList[0][0]",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bodyList",
          "path": "bodyList[1]",
          "value": Object {
            "blocks": Array [
              Object {
                "data": Object {
                  "text": "Second rich text item",
                },
                "type": "paragraph",
              },
              Object {
                "data": Object {
                  "text": "Second block in second rich text item",
                },
                "type": "paragraph",
              },
            ],
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterRichText",
          "fieldName": "bodyList",
          "path": "bodyList[1]",
        },
        Object {
          "action": "visitRichTextBlock",
          "blockData": Object {
            "text": "Second rich text item",
          },
          "blockType": "paragraph",
          "fieldName": "bodyList",
          "path": "bodyList[1][0]",
          "visitContext": undefined,
        },
        Object {
          "action": "visitRichTextBlock",
          "blockData": Object {
            "text": "Second block in second rich text item",
          },
          "blockType": "paragraph",
          "fieldName": "bodyList",
          "path": "bodyList[1][1]",
          "visitContext": undefined,
        },
      ]
    `);
  });

  test('recursive value items', () => {
    const schema = new Schema({
      entityTypes: [
        {
          name: 'Foo',
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
          fields: [
            { name: 'string', type: FieldType.String },
            { name: 'valueOne', type: FieldType.ValueType },
          ],
        },
      ],
    });
    const { calls, callbacks } = buildMockCallbacks();
    const entity: Entity = {
      id: 'id1',
      info: {
        type: 'Foo',
        name: 'hello',
      },
      fields: {
        valueOne: {
          _type: 'ValueOne',
          string: 'root',
          valueOne: {
            _type: 'ValueOne',
            string: 'root->valueOne',
            valueOne: { _type: 'ValueOne', string: 'root->valueOne->valueOne' },
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
      Array [
        Object {
          "action": "visitField",
          "fieldName": "valueOne",
          "path": "valueOne",
          "value": Object {
            "_type": "ValueOne",
            "string": "root",
            "valueOne": Object {
              "_type": "ValueOne",
              "string": "root->valueOne",
              "valueOne": Object {
                "_type": "ValueOne",
                "string": "root->valueOne->valueOne",
              },
            },
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterValueItem",
          "fieldName": "valueOne",
          "path": "valueOne",
          "type": "ValueOne",
        },
        Object {
          "action": "visitField",
          "fieldName": "string",
          "path": "valueOne.string",
          "value": "root",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "valueOne",
          "path": "valueOne.valueOne",
          "value": Object {
            "_type": "ValueOne",
            "string": "root->valueOne",
            "valueOne": Object {
              "_type": "ValueOne",
              "string": "root->valueOne->valueOne",
            },
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterValueItem",
          "fieldName": "valueOne",
          "path": "valueOne.valueOne",
          "type": "ValueOne",
        },
        Object {
          "action": "visitField",
          "fieldName": "string",
          "path": "valueOne.valueOne.string",
          "value": "root->valueOne",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "valueOne",
          "path": "valueOne.valueOne.valueOne",
          "value": Object {
            "_type": "ValueOne",
            "string": "root->valueOne->valueOne",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterValueItem",
          "fieldName": "valueOne",
          "path": "valueOne.valueOne.valueOne",
          "type": "ValueOne",
        },
        Object {
          "action": "visitField",
          "fieldName": "string",
          "path": "valueOne.valueOne.valueOne.string",
          "value": "root->valueOne->valueOne",
          "visitContext": undefined,
        },
      ]
    `);
  });
});
