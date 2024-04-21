import type { SchemaSpecificationUpdate, EntityLike } from '@dossierhq/core';
import {
  Schema,
  FieldType,
  createRichText,
  createRichTextComponentNode,
  createRichTextEntityLinkNode,
  createRichTextEntityNode,
  createRichTextHeadingNode,
  createRichTextParagraphNode,
  createRichTextTextNode,
  traverseEntity,
} from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import {
  createComponentTypesCollector,
  createFullTextSearchCollector,
  createLocationsCollector,
  createReferencesCollector,
  createRequestedReferencesCollector,
  createUniqueIndexCollector,
} from './EntityCollectors.js';

const schemaSpec: SchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'EntityCodecFoo',
      adminOnly: false,
      authKeyPattern: null,
      fields: [
        { name: 'slug', type: FieldType.String, index: 'slug' },
        { name: 'slugs', type: FieldType.String, list: true, index: 'slug' },
        { name: 'string', type: FieldType.String },
        { name: 'strings', type: FieldType.String, list: true },
        { name: 'location', type: FieldType.Location },
        { name: 'locations', type: FieldType.Location, list: true },
        { name: 'bar', type: FieldType.Reference, entityTypes: ['EntityCodecBar'] },
        { name: 'bars', type: FieldType.Reference, list: true, entityTypes: ['EntityCodecBar'] },
        { name: 'reference', type: FieldType.Reference },
        { name: 'component', type: FieldType.Component },
        { name: 'components', type: FieldType.Component, list: true },
        { name: 'valueOne', type: FieldType.Component },
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
  componentTypes: [
    {
      name: 'EntityCodecValueOne',
      adminOnly: false,
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'strings', type: FieldType.String, list: true },
        { name: 'location', type: FieldType.Location },
        { name: 'locations', type: FieldType.Location, list: true },
        { name: 'bar', type: FieldType.Reference, entityTypes: ['EntityCodecBar'] },
        { name: 'richText', type: FieldType.RichText, entityTypes: ['EntityCodecBar'] },
        { name: 'child', type: FieldType.Component, componentTypes: ['EntityCodecValueOne'] },
      ],
    },
    {
      name: 'EntityCodecValueTwo',
      adminOnly: false,
      fields: [],
    },
  ],
  indexes: [{ name: 'slug', type: 'unique' }],
};

const schema = Schema.createAndValidate(schemaSpec).valueOrThrow();

function collectDataFromEntity(adminSchema: Schema, entity: EntityLike) {
  const ftsCollector = createFullTextSearchCollector();
  const referencesCollector = createReferencesCollector();
  const requestedReferencesCollector = createRequestedReferencesCollector();
  const locationsCollector = createLocationsCollector();
  const uniqueIndexCollector = createUniqueIndexCollector(adminSchema.toPublishedSchema());
  const componentTypesCollector = createComponentTypesCollector();

  for (const node of traverseEntity(adminSchema, ['entity'], entity)) {
    ftsCollector.collect(node);
    referencesCollector.collect(node);
    requestedReferencesCollector.collect(node);
    locationsCollector.collect(node);
    uniqueIndexCollector.collect(node);
    componentTypesCollector.collect(node);
  }

  return {
    references: referencesCollector.result,
    requestedReferences: requestedReferencesCollector.result,
    locations: locationsCollector.result,
    fullTextSearchText: ftsCollector.result,
    uniqueIndex: uniqueIndexCollector.result,
    componentTypes: componentTypesCollector.result,
  };
}

describe('collectDataFromEntity', () => {
  test('empty', () => {
    expect(collectDataFromEntity(schema, { info: { type: 'EntityCodecFoo' }, fields: {} }))
      .toMatchInlineSnapshot(`
        {
          "componentTypes": [],
          "fullTextSearchText": "",
          "locations": [],
          "references": [],
          "requestedReferences": [],
          "uniqueIndex": Map {},
        }
      `);
  });

  test('name only', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
        fields: {},
      }),
    ).toMatchInlineSnapshot(`
      {
        "componentTypes": [],
        "fullTextSearchText": "",
        "locations": [],
        "references": [],
        "requestedReferences": [],
        "uniqueIndex": Map {},
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
      }),
    ).toMatchInlineSnapshot(`
      {
        "componentTypes": [],
        "fullTextSearchText": "Hello string world one two three",
        "locations": [],
        "references": [],
        "requestedReferences": [],
        "uniqueIndex": Map {},
      }
    `);
  });

  test('component strings', () => {
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
      }),
    ).toMatchInlineSnapshot(`
      {
        "componentTypes": [
          "EntityCodecValueOne",
        ],
        "fullTextSearchText": "one two three four",
        "locations": [],
        "references": [],
        "requestedReferences": [],
        "uniqueIndex": Map {},
      }
    `);
  });

  test('rich text strings', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
        fields: {
          richText: createRichText([
            createRichTextParagraphNode([createRichTextTextNode('one one')]),
            createRichTextComponentNode({ type: 'EntityCodecValueOne', string: 'one two' }),
            createRichTextHeadingNode('h1', [createRichTextTextNode('Header text')]),
          ]),
          richTexts: [
            createRichText([createRichTextParagraphNode([createRichTextTextNode('two')])]),
          ],
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "componentTypes": [
          "EntityCodecValueOne",
        ],
        "fullTextSearchText": "one one one two Header text two",
        "locations": [],
        "references": [],
        "requestedReferences": [],
        "uniqueIndex": Map {},
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
      }),
    ).toMatchInlineSnapshot(`
      {
        "componentTypes": [],
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
        "references": [],
        "requestedReferences": [],
        "uniqueIndex": Map {},
      }
    `);
  });

  test('component locations', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
        fields: {
          valueOne: { type: 'EntityCodecValueOne', location: { lat: 1, lng: 2 } },
          richText: createRichText([
            createRichTextComponentNode({
              type: 'EntityCodecValueOne',
              location: { lat: 3, lng: 4 },
            }),
          ]),
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "componentTypes": [
          "EntityCodecValueOne",
        ],
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
        "references": [],
        "requestedReferences": [],
        "uniqueIndex": Map {},
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
      }),
    ).toMatchInlineSnapshot(`
      {
        "componentTypes": [],
        "fullTextSearchText": "",
        "locations": [],
        "references": [
          {
            "id": "barId1",
          },
          {
            "id": "barId2",
          },
          {
            "id": "barId3",
          },
          {
            "id": "unspecifiedId1",
          },
        ],
        "requestedReferences": [
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "isRichTextLink": false,
            "linkEntityTypes": undefined,
            "path": [
              "entity",
              "fields",
              "bar",
            ],
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
            "path": [
              "entity",
              "fields",
              "bars",
              0,
            ],
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
            "path": [
              "entity",
              "fields",
              "bars",
              1,
            ],
            "uuids": [
              "barId3",
            ],
          },
          {
            "entityTypes": [],
            "isRichTextLink": false,
            "linkEntityTypes": undefined,
            "path": [
              "entity",
              "fields",
              "reference",
            ],
            "uuids": [
              "unspecifiedId1",
            ],
          },
        ],
        "uniqueIndex": Map {},
      }
    `);
  });

  test('component references', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
        fields: {
          valueOne: { type: 'EntityCodecValueOne', bar: { id: 'bar1Id' } },
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "componentTypes": [
          "EntityCodecValueOne",
        ],
        "fullTextSearchText": "",
        "locations": [],
        "references": [
          {
            "id": "bar1Id",
          },
        ],
        "requestedReferences": [
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "isRichTextLink": false,
            "linkEntityTypes": undefined,
            "path": [
              "entity",
              "fields",
              "valueOne",
              "bar",
            ],
            "uuids": [
              "bar1Id",
            ],
          },
        ],
        "uniqueIndex": Map {},
      }
    `);
  });

  test('rich text reference', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
        fields: {
          richText: createRichText([
            createRichTextEntityNode({ id: 'barId1' }),
            createRichTextEntityLinkNode({ id: 'barId2' }, [createRichTextTextNode('bar')]),
            createRichTextComponentNode({ type: 'EntityCodecValueOne', bar: { id: 'bar3Id' } }),
          ]),
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "componentTypes": [
          "EntityCodecValueOne",
        ],
        "fullTextSearchText": "bar",
        "locations": [],
        "references": [
          {
            "id": "barId1",
          },
          {
            "id": "barId2",
          },
          {
            "id": "bar3Id",
          },
        ],
        "requestedReferences": [
          {
            "entityTypes": [
              "EntityCodecBar",
            ],
            "isRichTextLink": false,
            "linkEntityTypes": [],
            "path": [
              "entity",
              "fields",
              "richText",
              0,
            ],
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
            "path": [
              "entity",
              "fields",
              "richText",
              1,
            ],
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
            "path": [
              "entity",
              "fields",
              "richText",
              2,
              "data",
              "bar",
            ],
            "uuids": [
              "bar3Id",
            ],
          },
        ],
        "uniqueIndex": Map {},
      }
    `);
  });

  test('components component types', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
        fields: {
          component: { type: 'EntityCodecValueOne' },
          components: [{ type: 'EntityCodecValueOne' }, { type: 'EntityCodecValueTwo' }],
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "componentTypes": [
          "EntityCodecValueOne",
          "EntityCodecValueTwo",
        ],
        "fullTextSearchText": "",
        "locations": [],
        "references": [],
        "requestedReferences": [],
        "uniqueIndex": Map {},
      }
    `);
  });

  test('rich text component type', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
        fields: {
          richText: createRichText([createRichTextComponentNode({ type: 'EntityCodecValueOne' })]),
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "componentTypes": [
          "EntityCodecValueOne",
        ],
        "fullTextSearchText": "",
        "locations": [],
        "references": [],
        "requestedReferences": [],
        "uniqueIndex": Map {},
      }
    `);
  });

  test('unique index values', () => {
    expect(
      collectDataFromEntity(schema, {
        info: { type: 'EntityCodecFoo' },
        fields: {
          slug: 'foo',
          slugs: ['foo', 'bar'],
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "componentTypes": [],
        "fullTextSearchText": "foo foo bar",
        "locations": [],
        "references": [],
        "requestedReferences": [],
        "uniqueIndex": Map {
          "slug" => [
            {
              "path": [
                "entity",
                "fields",
                "slug",
              ],
              "value": "foo",
            },
            {
              "path": [
                "entity",
                "fields",
                "slugs",
                1,
              ],
              "value": "bar",
            },
          ],
        },
      }
    `);
  });
});
