import { FieldType, RichTextBlockType } from '@datadata/core';
import type { Server } from '.';
import type { SessionContext } from './Context';
import { forTest } from './EntityCodec';
import { createTestServer, ensureSessionContext, updateSchema } from './ServerTestUtils';

const { collectDataFromEntity } = forTest;

let server: Server;
let context: SessionContext;

beforeAll(async () => {
  server = await createTestServer();
  context = await ensureSessionContext(server, 'test', 'entity-codec');

  await updateSchema(context, {
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
  });
});

describe('collectDataFromEntity', () => {
  test('empty', () => {
    expect(collectDataFromEntity(context, { _type: 'EntityCodecFoo' })).toMatchInlineSnapshot(`
      Object {
        "fullTextSearchText": Array [],
        "locations": Array [],
        "requestedReferences": Array [],
      }
    `);
  });

  test('name only', () => {
    expect(collectDataFromEntity(context, { _type: 'EntityCodecFoo', _name: 'hello world' }))
      .toMatchInlineSnapshot(`
      Object {
        "fullTextSearchText": Array [],
        "locations": Array [],
        "requestedReferences": Array [],
      }
    `);
  });

  test('strings', () => {
    expect(
      collectDataFromEntity(context, {
        _type: 'EntityCodecFoo',
        _name: 'hello world',
        string: 'Hello string world',
        strings: ['one', 'two', 'three'],
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
      collectDataFromEntity(context, {
        _type: 'EntityCodecFoo',
        _name: 'hello world',
        valueOne: {
          _type: 'EntityCodecValueOne',
          string: 'one',
          strings: ['two', 'three'],
          child: { _type: 'EntityCodecValueOne', string: 'four' },
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
      collectDataFromEntity(context, {
        _type: 'EntityCodecFoo',
        _name: 'hello world',
        richText: {
          blocks: [
            { type: RichTextBlockType.paragraph, data: { text: 'one one' } },
            {
              type: RichTextBlockType.valueItem,
              data: { _type: 'EntityCodecValueOne', string: 'one two' },
            },
          ],
        },
        richTexts: [{ blocks: [{ type: RichTextBlockType.paragraph, data: { text: 'two' } }] }],
      })
    ).toMatchInlineSnapshot(`
      Object {
        "fullTextSearchText": Array [
          "one one",
          "one two",
          "two",
        ],
        "locations": Array [],
        "requestedReferences": Array [],
      }
    `);
  });

  test('entity locations', () => {
    expect(
      collectDataFromEntity(context, {
        _type: 'EntityCodecFoo',
        _name: 'hello world',
        location: { lat: 1, lng: 2 },
        locations: [
          { lat: 3, lng: 4 },
          { lat: 5, lng: 6 },
        ],
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
      collectDataFromEntity(context, {
        _type: 'EntityCodecFoo',
        _name: 'hello world',
        valueOne: { _type: 'EntityCodecValueOne', location: { lat: 1, lng: 2 } },
        richText: {
          blocks: [
            {
              type: RichTextBlockType.valueItem,
              data: { _type: 'EntityCodecValueOne', location: { lat: 3, lng: 4 } },
            },
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
        ],
        "requestedReferences": Array [],
      }
    `);
  });

  test('entity references', () => {
    expect(
      collectDataFromEntity(context, {
        _type: 'EntityCodecFoo',
        bar: { id: 'barId1' },
        bars: [{ id: 'barId2' }, { id: 'barId3' }],
        reference: { id: 'unspecifiedId1' },
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
            "prefix": "entity.bar",
            "uuids": Array [
              "barId1",
            ],
          },
          Object {
            "entityTypes": Array [
              "EntityCodecBar",
            ],
            "prefix": "entity.bars[0]",
            "uuids": Array [
              "barId2",
            ],
          },
          Object {
            "entityTypes": Array [
              "EntityCodecBar",
            ],
            "prefix": "entity.bars[1]",
            "uuids": Array [
              "barId3",
            ],
          },
          Object {
            "entityTypes": undefined,
            "prefix": "entity.reference",
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
      collectDataFromEntity(context, {
        _type: 'EntityCodecFoo',
        valueOne: { _type: 'EntityCodecValueOne', bar: { id: 'bar1Id' } },
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
            "prefix": "entity.valueOne.bar",
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
      collectDataFromEntity(context, {
        _type: 'EntityCodecFoo',
        richText: {
          blocks: [
            { type: RichTextBlockType.entity, data: { id: 'barId1' } },
            {
              type: RichTextBlockType.valueItem,
              data: { _type: 'EntityCodecValueOne', bar: { id: 'bar2Id' } },
            },
          ],
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
            "prefix": "entity.richText[0]",
            "uuids": Array [
              "barId1",
            ],
          },
          Object {
            "entityTypes": Array [
              "EntityCodecBar",
            ],
            "prefix": "entity.richText[1].bar",
            "uuids": Array [
              "bar2Id",
            ],
          },
        ],
      }
    `);
  });
});
