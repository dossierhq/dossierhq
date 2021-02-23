import type { FieldSpecification, Value } from '.';
import { Schema, visitFieldsRecursively, visitorPathToString } from '.';
import { FieldType } from './Schema';

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
      enterValueItem: (
        path: Array<string | number>,
        fieldSpec: FieldSpecification,
        valueItem: Value,
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
    },
  };
}

describe('visitFieldsRecursively()', () => {
  test('no fields', () => {
    const schema = new Schema({ entityTypes: [{ name: 'Foo', fields: [] }], valueTypes: [] });
    const { calls, callbacks } = buildMockCallbacks();
    visitFieldsRecursively({
      schema,
      entity: { id: 'id1', _type: 'Foo', _name: 'hello' },
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
    visitFieldsRecursively({
      schema,
      entity: {
        id: 'id1',
        _type: 'Foo',
        _name: 'hello',
        string: 'Hello string',
        location: { lat: 55.60498, lng: 13.003822 },
        bar: { id: 'bar id 1' },
        valueOne: { _type: 'ValueOne', string: 'value string', bar: { id: 'bar id 2' } },
      },
      ...callbacks,
      initialVisitContext: undefined,
    });
    expect(calls).toMatchInlineSnapshot(`
      Array [
        Object {
          "action": "visitField",
          "fieldName": "string",
          "path": "entity.string",
          "value": "Hello string",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bar",
          "path": "entity.bar",
          "value": Object {
            "id": "bar id 1",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "location",
          "path": "entity.location",
          "value": Object {
            "lat": 55.60498,
            "lng": 13.003822,
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "valueOne",
          "path": "entity.valueOne",
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
          "path": "entity.valueOne",
          "type": "ValueOne",
        },
        Object {
          "action": "visitField",
          "fieldName": "string",
          "path": "entity.valueOne.string",
          "value": "value string",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bar",
          "path": "entity.valueOne.bar",
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
    visitFieldsRecursively({
      schema,
      entity: {
        id: 'id1',
        _type: 'Foo',
        _name: 'hello',
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
      ...callbacks,
      initialVisitContext: undefined,
    });
    expect(calls).toMatchInlineSnapshot(`
      Array [
        Object {
          "action": "enterList",
          "fieldName": "strings",
          "length": 2,
          "path": "entity.strings",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "path": "entity.strings[0]",
          "value": "Hello string",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "path": "entity.strings[1]",
          "value": "World string",
          "visitContext": undefined,
        },
        Object {
          "action": "enterList",
          "fieldName": "locations",
          "length": 1,
          "path": "entity.locations",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "locations",
          "path": "entity.locations[0]",
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
          "path": "entity.bars",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "path": "entity.bars[0]",
          "value": Object {
            "id": "bar id 1",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "path": "entity.bars[1]",
          "value": Object {
            "id": "bar id 2",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterList",
          "fieldName": "valueOnes",
          "length": 2,
          "path": "entity.valueOnes",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "valueOnes",
          "path": "entity.valueOnes[0]",
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
          "path": "entity.valueOnes[0]",
          "type": "ValueOne",
        },
        Object {
          "action": "enterList",
          "fieldName": "strings",
          "length": 2,
          "path": "entity.valueOnes[0].strings",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "path": "entity.valueOnes[0].strings[0]",
          "value": "One",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "path": "entity.valueOnes[0].strings[1]",
          "value": "Two",
          "visitContext": undefined,
        },
        Object {
          "action": "enterList",
          "fieldName": "bars",
          "length": 2,
          "path": "entity.valueOnes[0].bars",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "path": "entity.valueOnes[0].bars[0]",
          "value": Object {
            "id": "bar id 3",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "path": "entity.valueOnes[0].bars[1]",
          "value": Object {
            "id": "bar id 4",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "valueOnes",
          "path": "entity.valueOnes[1]",
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
          "path": "entity.valueOnes[1]",
          "type": "ValueOne",
        },
        Object {
          "action": "enterList",
          "fieldName": "strings",
          "length": 2,
          "path": "entity.valueOnes[1].strings",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "path": "entity.valueOnes[1].strings[0]",
          "value": "First",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "path": "entity.valueOnes[1].strings[1]",
          "value": "Second",
          "visitContext": undefined,
        },
        Object {
          "action": "enterList",
          "fieldName": "bars",
          "length": 2,
          "path": "entity.valueOnes[1].bars",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "path": "entity.valueOnes[1].bars[0]",
          "value": Object {
            "id": "bar id 5",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "path": "entity.valueOnes[1].bars[1]",
          "value": Object {
            "id": "bar id 6",
          },
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
    visitFieldsRecursively({
      schema,
      entity: {
        id: 'id1',
        _type: 'Foo',
        _name: 'hello',
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
      ...callbacks,
      initialVisitContext: undefined,
    });
    expect(calls).toMatchInlineSnapshot(`
      Array [
        Object {
          "action": "visitField",
          "fieldName": "valueOne",
          "path": "entity.valueOne",
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
          "path": "entity.valueOne",
          "type": "ValueOne",
        },
        Object {
          "action": "visitField",
          "fieldName": "string",
          "path": "entity.valueOne.string",
          "value": "root",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "valueOne",
          "path": "entity.valueOne.valueOne",
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
          "path": "entity.valueOne.valueOne",
          "type": "ValueOne",
        },
        Object {
          "action": "visitField",
          "fieldName": "string",
          "path": "entity.valueOne.valueOne.string",
          "value": "root->valueOne",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "valueOne",
          "path": "entity.valueOne.valueOne.valueOne",
          "value": Object {
            "_type": "ValueOne",
            "string": "root->valueOne->valueOne",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterValueItem",
          "fieldName": "valueOne",
          "path": "entity.valueOne.valueOne.valueOne",
          "type": "ValueOne",
        },
        Object {
          "action": "visitField",
          "fieldName": "string",
          "path": "entity.valueOne.valueOne.valueOne.string",
          "value": "root->valueOne->valueOne",
          "visitContext": undefined,
        },
      ]
    `);
  });
});
