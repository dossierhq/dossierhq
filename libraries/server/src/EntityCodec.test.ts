import type { AdminSchemaSpecificationUpdate, EntityLike } from '@jonasb/datadata-core';
import {
  AdminSchema,
  createRichTextEntityLinkNode,
  createRichTextEntityNode,
  createRichTextHeadingNode,
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextNode,
  createRichTextValueItemNode,
  FieldType,
  traverseEntity,
} from '@jonasb/datadata-core';
import { describe, expect, test } from 'vitest';
import {
  createFullTextSearchCollector,
  createLocationsCollector,
  createRequestedReferencesCollector,
} from './EntityCodec.js';

const schemaSpec: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'EntityCodecFoo',
      adminOnly: false,
      authKeyPattern: null,
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'strings', type: FieldType.String, list: true },
        { name: 'location', type: FieldType.Location },
        { name: 'locations', type: FieldType.Location, list: true },
        { name: 'bar', type: FieldType.Entity, entityTypes: ['EntityCodecBar'] },
        { name: 'bars', type: FieldType.Entity, list: true, entityTypes: ['EntityCodecBar'] },
        { name: 'reference', type: FieldType.Entity },
        { name: 'valueOne', type: FieldType.ValueItem },
        { name: 'richText', type: FieldType.RichText, entityTypes: ['EntityCodecBar'] },
        { name: 'richTexts', type: FieldType.RichText, list: true },
      ],
    },
    {
      name: 'EntityCodecBar',
      adminOnly: false,
      authKeyPattern: null,
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
        { name: 'bar', type: FieldType.Entity, entityTypes: ['EntityCodecBar'] },
        { name: 'richText', type: FieldType.RichText, entityTypes: ['EntityCodecBar'] },
        { name: 'child', type: FieldType.ValueItem, valueTypes: ['EntityCodecValueOne'] },
      ],
    },
  ],
};

const schema = AdminSchema.createAndValidate(schemaSpec).valueOrThrow();

function collectDataFromEntity(adminSchema: AdminSchema, entity: EntityLike) {
  const ftsCollector = createFullTextSearchCollector();
  const referencesCollector = createRequestedReferencesCollector();
  const locationsCollector = createLocationsCollector();

  for (const node of traverseEntity(adminSchema, ['entity'], entity)) {
    ftsCollector.collect(node);
    referencesCollector.collect(node);
    locationsCollector.collect(node);
  }

  return {
    requestedReferences: referencesCollector.result,
    locations: locationsCollector.result,
    fullTextSearchText: ftsCollector.result,
  };
}

describe('collectDataFromEntity', () => {
  test('empty', () => {
    expect(collectDataFromEntity(schema, { info: { type: 'EntityCodecFoo' }, fields: {} }))
      .toMatchInlineSnapshot(`
        {
          "fullTextSearchText": "",
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
        "fullTextSearchText": "",
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
        "fullTextSearchText": "Hello string world one two three",
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
        "fullTextSearchText": "one two three four",
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
          richText: createRichTextRootNode([
            createRichTextParagraphNode([createRichTextTextNode('one one')]),
            createRichTextValueItemNode({ type: 'EntityCodecValueOne', string: 'one two' }),
            createRichTextHeadingNode('h1', [createRichTextTextNode('Header text')]),
          ]),
          richTexts: [
            createRichTextRootNode([createRichTextParagraphNode([createRichTextTextNode('two')])]),
          ],
        },
      })
    ).toMatchInlineSnapshot(`
      {
        "fullTextSearchText": "one one one two Header text two",
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
        "fullTextSearchText": "",
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
          richText: createRichTextRootNode([
            createRichTextValueItemNode({
              type: 'EntityCodecValueOne',
              location: { lat: 3, lng: 4 },
            }),
          ]),
        },
      })
    ).toMatchInlineSnapshot(`
      {
        "fullTextSearchText": "",
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
        "fullTextSearchText": "",
        "locations": [],
        "requestedReferences": [
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "isRichTextLink": false,
            "linkEntityTypes": undefined,
            "prefix": "entity.fields.bar",
            "uuids": [
              "barId1",
            ],
          },
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "isRichTextLink": false,
            "linkEntityTypes": undefined,
            "prefix": "entity.fields.bars[0]",
            "uuids": [
              "barId2",
            ],
          },
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "isRichTextLink": false,
            "linkEntityTypes": undefined,
            "prefix": "entity.fields.bars[1]",
            "uuids": [
              "barId3",
            ],
          },
          {
            "entityTypes": [],
            "isRichTextLink": false,
            "linkEntityTypes": undefined,
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
        "fullTextSearchText": "",
        "locations": [],
        "requestedReferences": [
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "isRichTextLink": false,
            "linkEntityTypes": undefined,
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
          richText: createRichTextRootNode([
            createRichTextEntityNode({ id: 'barId1' }),
            createRichTextEntityLinkNode({ id: 'barId2' }, [createRichTextTextNode('bar')]),
            createRichTextValueItemNode({ type: 'EntityCodecValueOne', bar: { id: 'bar3Id' } }),
          ]),
        },
      })
    ).toMatchInlineSnapshot(`
      {
        "fullTextSearchText": "bar",
        "locations": [],
        "requestedReferences": [
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "isRichTextLink": false,
            "linkEntityTypes": [],
            "prefix": "entity.fields.richText[0]",
            "uuids": [
              "barId1",
            ],
          },
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "isRichTextLink": true,
            "linkEntityTypes": [],
            "prefix": "entity.fields.richText[1]",
            "uuids": [
              "barId2",
            ],
          },
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "isRichTextLink": false,
            "linkEntityTypes": undefined,
            "prefix": "entity.fields.richText[2].data.bar",
            "uuids": [
              "bar3Id",
            ],
          },
        ],
      }
    `);
  });
});
