import type { FieldSpecification, Value } from '.';
import { Schema, visitFieldsRecursively } from '.';
import { FieldType } from './Schema';

function buildMockCallbacks<TVisitContext>() {
  const calls: unknown[] = [];
  return {
    calls,
    callbacks: {
      visitField: (
        fieldSpec: FieldSpecification,
        data: unknown,
        visitContext: TVisitContext,
        listIndex: number | undefined
      ) => {
        calls.push({
          action: 'visitField',
          value: data,
          visitContext,
          listIndex,
          fieldName: fieldSpec.name,
        });
      },
      enterValueItem: (
        fieldSpec: FieldSpecification,
        valueItem: Value,
        visitContext: TVisitContext
      ) => {
        calls.push({ action: 'enterValueItem', type: valueItem._type, fieldName: fieldSpec.name });
        return visitContext;
      },
      enterList: (fieldSpec: FieldSpecification, list: unknown[], visitContext: TVisitContext) => {
        calls.push({
          action: 'enterList',
          length: list.length,
          visitContext,
          fieldName: fieldSpec.name,
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
          "listIndex": undefined,
          "value": "Hello string",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bar",
          "listIndex": undefined,
          "value": Object {
            "id": "bar id 1",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "valueOne",
          "listIndex": undefined,
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
          "type": "ValueOne",
        },
        Object {
          "action": "visitField",
          "fieldName": "string",
          "listIndex": undefined,
          "value": "value string",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bar",
          "listIndex": undefined,
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
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "listIndex": 0,
          "value": "Hello string",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "listIndex": 1,
          "value": "World string",
          "visitContext": undefined,
        },
        Object {
          "action": "enterList",
          "fieldName": "bars",
          "length": 2,
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "listIndex": 0,
          "value": Object {
            "id": "bar id 1",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "listIndex": 1,
          "value": Object {
            "id": "bar id 2",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "enterList",
          "fieldName": "valueOnes",
          "length": 2,
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "valueOnes",
          "listIndex": 0,
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
          "type": "ValueOne",
        },
        Object {
          "action": "enterList",
          "fieldName": "strings",
          "length": 2,
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "listIndex": 0,
          "value": "One",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "listIndex": 1,
          "value": "Two",
          "visitContext": undefined,
        },
        Object {
          "action": "enterList",
          "fieldName": "bars",
          "length": 2,
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "listIndex": 0,
          "value": Object {
            "id": "bar id 3",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "listIndex": 1,
          "value": Object {
            "id": "bar id 4",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "valueOnes",
          "listIndex": 1,
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
          "type": "ValueOne",
        },
        Object {
          "action": "enterList",
          "fieldName": "strings",
          "length": 2,
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "listIndex": 0,
          "value": "First",
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "strings",
          "listIndex": 1,
          "value": "Second",
          "visitContext": undefined,
        },
        Object {
          "action": "enterList",
          "fieldName": "bars",
          "length": 2,
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "listIndex": 0,
          "value": Object {
            "id": "bar id 5",
          },
          "visitContext": undefined,
        },
        Object {
          "action": "visitField",
          "fieldName": "bars",
          "listIndex": 1,
          "value": Object {
            "id": "bar id 6",
          },
          "visitContext": undefined,
        },
      ]
    `);
  });
});
