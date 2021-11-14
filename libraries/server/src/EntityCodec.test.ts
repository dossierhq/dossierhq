import type { AdminSchemaSpecification } from '@jonasb/datadata-core';
import { FieldType, RichTextBlockType, Schema } from '@jonasb/datadata-core';
import { forTest } from './EntityCodec';

const { collectDataFromEntity } = forTest;

const schemaSpec: AdminSchemaSpecification = {
  entityTypes: [
    {
      name: 'EntityCodecFoo',
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'strings', type: FieldType.String, list: true },
        { name: 'location', type: FieldType.Location },
        { name: 'locations', type: FieldType.Location, list: true },
        { name: 'bar', type: FieldType.EntityType, entityTypes: ['EntityCodecBar'] },
        { name: 'bars', type: FieldType.EntityType, list: true, entityTypes: ['EntityCodecBar'] },
        { name: 'reference', type: FieldType.EntityType },
        { name: 'valueOne', type: FieldType.ValueType },
        { name: 'richText', type: FieldType.RichText, entityTypes: ['EntityCodecBar'] },
        { name: 'richTexts', type: FieldType.RichText, list: true },
      ],
    },
    {
      name: 'EntityCodecBar',
      fields: [],
    },
  ],
  valueTypes: [
    {
      name: 'EntityCodecValueOne',
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'strings', type: FieldType.String, list: true },
        { name: 'location', type: FieldType.Location },
        { name: 'locations', type: FieldType.Location, list: true },
        { name: 'bar', type: FieldType.EntityType, entityTypes: ['EntityCodecBar'] },
        { name: 'richText', type: FieldType.RichText, entityTypes: ['EntityCodecBar'] },
        { name: 'child', type: FieldType.ValueType, valueTypes: ['EntityCodecValueOne'] },
      ],
    },
  ],
};

const schema = new Schema(schemaSpec);

describe('collectDataFromEntity', () => {
  test('empty', () => {
    expect(
      collectDataFromEntity(schema, { info: { type: 'EntityCodecFoo', name: 'foo' }, fields: {} })
    ).toMatchInlineSnapshot(`
      Object {
        "fullTextSearchText": Array [],
        "locations": Array [],
        "requestedReferences": Array [],
      }
    `);
  });

  test('name only', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo', name: 'hello world' },
        fields: {},
      })
    ).toMatchInlineSnapshot(`
      Object {
        "fullTextSearchText": Array [],
        "locations": Array [],
        "requestedReferences": Array [],
      }
    `);
  });

  test('strings', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo', name: 'hello world' },
        fields: {
          string: 'Hello string world',
          strings: ['one', 'two', 'three'],
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "fullTextSearchText": Array [
          "Hello string world",
          "one",
          "two",
          "three",
        ],
        "locations": Array [],
        "requestedReferences": Array [],
      }
    `);
  });

  test('value item strings', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo', name: 'hello world' },
        fields: {
          valueOne: {
            type: 'EntityCodecValueOne',
            string: 'one',
            strings: ['two', 'three'],
            child: { type: 'EntityCodecValueOne', string: 'four' },
          },
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "fullTextSearchText": Array [
          "one",
          "two",
          "three",
          "four",
        ],
        "locations": Array [],
        "requestedReferences": Array [],
      }
    `);
  });

  test('rich text strings', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo', name: 'hello world' },
        fields: {
          richText: {
            blocks: [
              { type: RichTextBlockType.paragraph, data: { text: 'one one' } },
              {
                type: RichTextBlockType.valueItem,
                data: { type: 'EntityCodecValueOne', string: 'one two' },
              },
              {
                type: 'header',
                data: { level: 3, text: 'Header text' },
              },
              {
                type: 'random',
                data: { foo: ['a', 'b'], bar: { z: 123 } },
              },
            ],
          },
          richTexts: [{ blocks: [{ type: RichTextBlockType.paragraph, data: { text: 'two' } }] }],
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "fullTextSearchText": Array [
          "one one",
          "one two",
          "3",
          "Header text",
          "a",
          "b",
          "123",
          "two",
        ],
        "locations": Array [],
        "requestedReferences": Array [],
      }
    `);
  });

  test('entity locations', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo', name: 'hello world' },
        fields: {
          location: { lat: 1, lng: 2 },
          locations: [
            { lat: 3, lng: 4 },
            { lat: 5, lng: 6 },
          ],
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "fullTextSearchText": Array [],
        "locations": Array [
          Object {
            "lat": 1,
            "lng": 2,
          },
          Object {
            "lat": 3,
            "lng": 4,
          },
          Object {
            "lat": 5,
            "lng": 6,
          },
        ],
        "requestedReferences": Array [],
      }
    `);
  });

  test('value item locations', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo', name: 'hello world' },
        fields: {
          valueOne: { type: 'EntityCodecValueOne', location: { lat: 1, lng: 2 } },
          richText: {
            blocks: [
              {
                type: RichTextBlockType.valueItem,
                data: { type: 'EntityCodecValueOne', location: { lat: 3, lng: 4 } },
              },
            ],
          },
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "fullTextSearchText": Array [],
        "locations": Array [
          Object {
            "lat": 1,
            "lng": 2,
          },
          Object {
            "lat": 3,
            "lng": 4,
          },
        ],
        "requestedReferences": Array [],
      }
    `);
  });

  test('entity references', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo', name: 'foo' },
        fields: {
          bar: { id: 'barId1' },
          bars: [{ id: 'barId2' }, { id: 'barId3' }],
          reference: { id: 'unspecifiedId1' },
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "fullTextSearchText": Array [],
        "locations": Array [],
        "requestedReferences": Array [
          Object {
            "entityTypes": Array [
              "EntityCodecBar",
            ],
            "prefix": "entity.fields.bar",
            "uuids": Array [
              "barId1",
            ],
          },
          Object {
            "entityTypes": Array [
              "EntityCodecBar",
            ],
            "prefix": "entity.fields.bars[0]",
            "uuids": Array [
              "barId2",
            ],
          },
          Object {
            "entityTypes": Array [
              "EntityCodecBar",
            ],
            "prefix": "entity.fields.bars[1]",
            "uuids": Array [
              "barId3",
            ],
          },
          Object {
            "entityTypes": undefined,
            "prefix": "entity.fields.reference",
            "uuids": Array [
              "unspecifiedId1",
            ],
          },
        ],
      }
    `);
  });

  test('value item references', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo', name: 'foo' },
        fields: {
          valueOne: { type: 'EntityCodecValueOne', bar: { id: 'bar1Id' } },
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "fullTextSearchText": Array [],
        "locations": Array [],
        "requestedReferences": Array [
          Object {
            "entityTypes": Array [
              "EntityCodecBar",
            ],
            "prefix": "entity.fields.valueOne.bar",
            "uuids": Array [
              "bar1Id",
            ],
          },
        ],
      }
    `);
  });

  test('rich text reference', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo', name: 'foo' },
        fields: {
          richText: {
            blocks: [
              { type: RichTextBlockType.entity, data: { id: 'barId1' } },
              {
                type: RichTextBlockType.valueItem,
                data: { type: 'EntityCodecValueOne', bar: { id: 'bar2Id' } },
              },
            ],
          },
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "fullTextSearchText": Array [],
        "locations": Array [],
        "requestedReferences": Array [
          Object {
            "entityTypes": Array [
              "EntityCodecBar",
            ],
            "prefix": "entity.fields.richText[0]",
            "uuids": Array [
              "barId1",
            ],
          },
          Object {
            "entityTypes": Array [
              "EntityCodecBar",
            ],
            "prefix": "entity.fields.richText[1].bar",
            "uuids": Array [
              "bar2Id",
            ],
          },
        ],
      }
    `);
  });
});
