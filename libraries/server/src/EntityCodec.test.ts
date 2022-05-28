import type { AdminSchemaSpecification } from '@jonasb/datadata-core';
import { AdminSchema, FieldType, RichTextBlockType } from '@jonasb/datadata-core';
import { describe, expect, test } from 'vitest';
import { forTest } from './EntityCodec';

const { collectDataFromEntity } = forTest;

const schemaSpec: AdminSchemaSpecification = {
  entityTypes: [
    {
      name: 'EntityCodecFoo',
      adminOnly: false,
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
      adminOnly: false,
      fields: [],
    },
  ],
  valueTypes: [
    {
      name: 'EntityCodecValueOne',
      adminOnly: false,
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

const schema = new AdminSchema(schemaSpec);

describe('collectDataFromEntity', () => {
  test('empty', () => {
    expect(collectDataFromEntity(schema, { info: { type: 'EntityCodecFoo' }, fields: {} }))
      .toMatchInlineSnapshot(`
        {
          "fullTextSearchText": [],
          "locations": [],
          "requestedReferences": [],
        }
      `);
  });

  test('name only', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
        fields: {},
      })
    ).toMatchInlineSnapshot(`
      {
        "fullTextSearchText": [],
        "locations": [],
        "requestedReferences": [],
      }
    `);
  });

  test('strings', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
        fields: {
          string: 'Hello string world',
          strings: ['one', 'two', 'three'],
        },
      })
    ).toMatchInlineSnapshot(`
      {
        "fullTextSearchText": [
          "Hello string world",
          "one",
          "two",
          "three",
        ],
        "locations": [],
        "requestedReferences": [],
      }
    `);
  });

  test('value item strings', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
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
      {
        "fullTextSearchText": [
          "one",
          "two",
          "three",
          "four",
        ],
        "locations": [],
        "requestedReferences": [],
      }
    `);
  });

  test('rich text strings', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
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
      {
        "fullTextSearchText": [
          "one one",
          "one two",
          "3",
          "Header text",
          "a",
          "b",
          "123",
          "two",
        ],
        "locations": [],
        "requestedReferences": [],
      }
    `);
  });

  test('entity locations', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
        fields: {
          location: { lat: 1, lng: 2 },
          locations: [
            { lat: 3, lng: 4 },
            { lat: 5, lng: 6 },
          ],
        },
      })
    ).toMatchInlineSnapshot(`
      {
        "fullTextSearchText": [],
        "locations": [
          {
            "lat": 1,
            "lng": 2,
          },
          {
            "lat": 3,
            "lng": 4,
          },
          {
            "lat": 5,
            "lng": 6,
          },
        ],
        "requestedReferences": [],
      }
    `);
  });

  test('value item locations', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
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
      {
        "fullTextSearchText": [],
        "locations": [
          {
            "lat": 1,
            "lng": 2,
          },
          {
            "lat": 3,
            "lng": 4,
          },
        ],
        "requestedReferences": [],
      }
    `);
  });

  test('entity references', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
        fields: {
          bar: { id: 'barId1' },
          bars: [{ id: 'barId2' }, { id: 'barId3' }],
          reference: { id: 'unspecifiedId1' },
        },
      })
    ).toMatchInlineSnapshot(`
      {
        "fullTextSearchText": [],
        "locations": [],
        "requestedReferences": [
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "prefix": "entity.fields.bar",
            "uuids": [
              "barId1",
            ],
          },
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "prefix": "entity.fields.bars[0]",
            "uuids": [
              "barId2",
            ],
          },
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "prefix": "entity.fields.bars[1]",
            "uuids": [
              "barId3",
            ],
          },
          {
            "entityTypes": undefined,
            "prefix": "entity.fields.reference",
            "uuids": [
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
        info: { type: 'EntityCodecFoo' },
        fields: {
          valueOne: { type: 'EntityCodecValueOne', bar: { id: 'bar1Id' } },
        },
      })
    ).toMatchInlineSnapshot(`
      {
        "fullTextSearchText": [],
        "locations": [],
        "requestedReferences": [
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "prefix": "entity.fields.valueOne.bar",
            "uuids": [
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
        info: { type: 'EntityCodecFoo' },
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
      {
        "fullTextSearchText": [],
        "locations": [],
        "requestedReferences": [
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "prefix": "entity.fields.richText[0]",
            "uuids": [
              "barId1",
            ],
          },
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "prefix": "entity.fields.richText[1].bar",
            "uuids": [
              "bar2Id",
            ],
          },
        ],
      }
    `);
  });
});
