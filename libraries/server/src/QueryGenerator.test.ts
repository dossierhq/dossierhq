import {
  AdminQueryOrder,
  AdminSchema,
  CoreTestUtils,
  EntityPublishState,
  ErrorType,
  QueryOrder,
} from '@jonasb/datadata-core';
import { toOpaqueCursor } from './Connection';
import {
  searchAdminEntitiesQuery,
  searchPublishedEntitiesQuery,
  totalAdminEntitiesQuery,
  totalPublishedEntitiesQuery,
} from './QueryGenerator';

const { expectErrorResult } = CoreTestUtils;

const schema = new AdminSchema({
  entityTypes: [
    { name: 'QueryGeneratorFoo', adminOnly: false, fields: [] },
    { name: 'QueryGeneratorBar', adminOnly: false, fields: [] },
  ],
  valueTypes: [],
});

describe('searchAdminEntitiesQuery()', () => {
  test('default paging', () => {
    expect(searchAdminEntitiesQuery(schema, undefined, undefined)).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('first 10', () => {
    expect(searchAdminEntitiesQuery(schema, undefined, { first: 10 })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
          "values": Array [
            11,
          ],
        },
      }
    `);
  });

  test('first 10 after', () => {
    expect(
      searchAdminEntitiesQuery(schema, undefined, { first: 10, after: toOpaqueCursor('int', 999) })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.id > $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            999,
            11,
          ],
        },
      }
    `);
  });

  test('last 10', () => {
    expect(searchAdminEntitiesQuery(schema, undefined, { last: 10 })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id DESC LIMIT $1",
          "values": Array [
            11,
          ],
        },
      }
    `);
  });

  test('last 10 before', () => {
    expect(
      searchAdminEntitiesQuery(schema, undefined, { last: 10, before: toOpaqueCursor('int', 456) })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.id < $1 ORDER BY e.id DESC LIMIT $2",
          "values": Array [
            456,
            11,
          ],
        },
      }
    `);
  });

  test('first 10 between after and before', () => {
    expect(
      searchAdminEntitiesQuery(schema, undefined, {
        first: 10,
        after: toOpaqueCursor('int', 123),
        before: toOpaqueCursor('int', 456),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.id > $1 AND e.id < $2 ORDER BY e.id LIMIT $3",
          "values": Array [
            123,
            456,
            11,
          ],
        },
      }
    `);
  });

  test('last 10 between after and before', () => {
    expect(
      searchAdminEntitiesQuery(schema, undefined, {
        last: 10,
        after: toOpaqueCursor('int', 123),
        before: toOpaqueCursor('int', 456),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.id > $1 AND e.id < $2 ORDER BY e.id DESC LIMIT $3",
          "values": Array [
            123,
            456,
            11,
          ],
        },
      }
    `);
  });

  test('order by createdAt, reversed', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        { order: AdminQueryOrder.createdAt, reverse: true },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id DESC LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('query no entity type, i.e. include all', () => {
    expect(searchAdminEntitiesQuery(schema, { entityTypes: [] }, undefined)).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('query one entity type', () => {
    expect(searchAdminEntitiesQuery(schema, { entityTypes: ['QueryGeneratorFoo'] }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.type = ANY($1) ORDER BY e.id LIMIT $2",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
            ],
            26,
          ],
        },
      }
    `);
  });

  test('query two entity types', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.type = ANY($1) ORDER BY e.id LIMIT $2",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
            26,
          ],
        },
      }
    `);
  });

  test('query two entity types, first and after', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        { first: 10, after: toOpaqueCursor('int', 543) }
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.type = ANY($1) AND e.id > $2 ORDER BY e.id LIMIT $3",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
            543,
            11,
          ],
        },
      }
    `);
  });

  test('query status empty list', () => {
    expect(searchAdminEntitiesQuery(schema, { status: [] }, undefined)).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('query status draft', () => {
    expect(searchAdminEntitiesQuery(schema, { status: [EntityPublishState.Draft] }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND status = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "draft",
            26,
          ],
        },
      }
    `);
  });

  test('query status published', () => {
    expect(searchAdminEntitiesQuery(schema, { status: [EntityPublishState.Published] }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND status = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "published",
            26,
          ],
        },
      }
    `);
  });

  test('query status modified', () => {
    expect(searchAdminEntitiesQuery(schema, { status: [EntityPublishState.Modified] }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND status = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "modified",
            26,
          ],
        },
      }
    `);
  });

  test('query status withdrawn', () => {
    expect(searchAdminEntitiesQuery(schema, { status: [EntityPublishState.Withdrawn] }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND status = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "withdrawn",
            26,
          ],
        },
      }
    `);
  });

  test('query status archived', () => {
    expect(searchAdminEntitiesQuery(schema, { status: [EntityPublishState.Archived] }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND status = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "archived",
            26,
          ],
        },
      }
    `);
  });

  test('query status draft+published', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        { status: [EntityPublishState.Draft, EntityPublishState.Published] },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND status = ANY($1) ORDER BY e.id LIMIT $2",
          "values": Array [
            Array [
              "draft",
              "published",
            ],
            26,
          ],
        },
      }
    `);
  });

  test('query status draft+archived', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        { status: [EntityPublishState.Draft, EntityPublishState.Archived] },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND status = ANY($1) ORDER BY e.id LIMIT $2",
          "values": Array [
            Array [
              "draft",
              "archived",
            ],
            26,
          ],
        },
      }
    `);
  });

  test('query status all', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        {
          status: [
            EntityPublishState.Draft,
            EntityPublishState.Published,
            EntityPublishState.Modified,
            EntityPublishState.Archived,
            EntityPublishState.Withdrawn,
          ],
        },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND status = ANY($1) ORDER BY e.id LIMIT $2",
          "values": Array [
            Array [
              "draft",
              "published",
              "modified",
              "archived",
              "withdrawn",
            ],
            26,
          ],
        },
      }
    `);
  });

  test('query referencing', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        { referencing: '37b48706-803e-4227-a51e-8208db12d949' },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.latest_draft_entity_versions_id = ev.id AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "37b48706-803e-4227-a51e-8208db12d949",
            26,
          ],
        },
      }
    `);
  });

  test('query bounding box', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        {
          boundingBox: {
            minLat: 55.07,
            maxLat: 56.79,
            minLng: 11.62,
            maxLng: 16.25,
          },
        },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev, entity_version_locations evl WHERE e.latest_draft_entity_versions_id = ev.id AND ev.id = evl.entity_versions_id AND evl.location && ST_MakeEnvelope($1, $2, $3, $4, 4326) ORDER BY e.id LIMIT $5",
          "values": Array [
            11.62,
            55.07,
            16.25,
            56.79,
            26,
          ],
        },
      }
    `);
  });

  test('query text', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        {
          text: 'foo bar',
        },
        {}
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.latest_fts @@ websearch_to_tsquery($1) ORDER BY e.id LIMIT $2",
          "values": Array [
            "foo bar",
            26,
          ],
        },
      }
    `);
  });

  test('query referencing and entity types and paging', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        {
          entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
          referencing: '37b48706-803e-4227-a51e-8208db12d949',
        },
        { first: 10, after: toOpaqueCursor('int', 123) }
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.latest_draft_entity_versions_id = ev.id AND e.type = ANY($1) AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $2 AND e.id > $3 ORDER BY e.id LIMIT $4",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
            "37b48706-803e-4227-a51e-8208db12d949",
            123,
            11,
          ],
        },
      }
    `);
  });

  test('order by createdAt', () => {
    expect(searchAdminEntitiesQuery(schema, { order: AdminQueryOrder.createdAt }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('order by updatedAt', () => {
    expect(searchAdminEntitiesQuery(schema, { order: AdminQueryOrder.updatedAt }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.updated LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('order by name', () => {
    expect(searchAdminEntitiesQuery(schema, { order: AdminQueryOrder.name }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.created_at, e.updated_at, e.updated, e.archived, e.never_published, e.latest_draft_entity_versions_id, e.published_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id ORDER BY e.name LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('Error: invalid entity type in query', () => {
    const result = searchAdminEntitiesQuery(schema, { entityTypes: ['Invalid'] }, undefined);
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find entity type in query: Invalid');
  });
});

describe('searchPublishedEntitiesQuery()', () => {
  test('default paging', () => {
    expect(searchPublishedEntitiesQuery(schema, undefined, undefined)).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('first 10', () => {
    expect(searchPublishedEntitiesQuery(schema, undefined, { first: 10 })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
          "values": Array [
            11,
          ],
        },
      }
    `);
  });

  test('first 10 after', () => {
    expect(
      searchPublishedEntitiesQuery(schema, undefined, {
        first: 10,
        after: toOpaqueCursor('int', 999),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.id > $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            999,
            11,
          ],
        },
      }
    `);
  });

  test('first 10 after reversed', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        { reverse: true },
        {
          first: 10,
          after: toOpaqueCursor('int', 999),
        }
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.id < $1 ORDER BY e.id DESC LIMIT $2",
          "values": Array [
            999,
            11,
          ],
        },
      }
    `);
  });

  test('last 10', () => {
    expect(searchPublishedEntitiesQuery(schema, undefined, { last: 10 })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id ORDER BY e.id DESC LIMIT $1",
          "values": Array [
            11,
          ],
        },
      }
    `);
  });

  test('last 10 before', () => {
    expect(
      searchPublishedEntitiesQuery(schema, undefined, {
        last: 10,
        before: toOpaqueCursor('int', 456),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.id < $1 ORDER BY e.id DESC LIMIT $2",
          "values": Array [
            456,
            11,
          ],
        },
      }
    `);
  });

  test('first 10 between after and before', () => {
    expect(
      searchPublishedEntitiesQuery(schema, undefined, {
        first: 10,
        after: toOpaqueCursor('int', 123),
        before: toOpaqueCursor('int', 456),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.id > $1 AND e.id < $2 ORDER BY e.id LIMIT $3",
          "values": Array [
            123,
            456,
            11,
          ],
        },
      }
    `);
  });

  test('first 10 between after and before reversed', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        { reverse: true },
        {
          first: 10,
          after: toOpaqueCursor('int', 123),
          before: toOpaqueCursor('int', 456),
        }
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.id < $1 AND e.id > $2 ORDER BY e.id DESC LIMIT $3",
          "values": Array [
            123,
            456,
            11,
          ],
        },
      }
    `);
  });

  test('last 10 between after and before', () => {
    expect(
      searchPublishedEntitiesQuery(schema, undefined, {
        last: 10,
        after: toOpaqueCursor('int', 123),
        before: toOpaqueCursor('int', 456),
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.id > $1 AND e.id < $2 ORDER BY e.id DESC LIMIT $3",
          "values": Array [
            123,
            456,
            11,
          ],
        },
      }
    `);
  });

  test('order by createdAt, reversed', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        { order: QueryOrder.createdAt, reverse: true },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id ORDER BY e.id DESC LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('query no entity type, i.e. include all', () => {
    expect(searchPublishedEntitiesQuery(schema, { entityTypes: [] }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('query one entity type', () => {
    expect(searchPublishedEntitiesQuery(schema, { entityTypes: ['QueryGeneratorFoo'] }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.type = ANY($1) ORDER BY e.id LIMIT $2",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
            ],
            26,
          ],
        },
      }
    `);
  });

  test('query two entity types', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.type = ANY($1) ORDER BY e.id LIMIT $2",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
            26,
          ],
        },
      }
    `);
  });

  test('query two entity types, first and after', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        { first: 10, after: toOpaqueCursor('int', 543) }
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.type = ANY($1) AND e.id > $2 ORDER BY e.id LIMIT $3",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
            543,
            11,
          ],
        },
      }
    `);
  });

  test('query referencing', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        { referencing: '37b48706-803e-4227-a51e-8208db12d949' },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.published_entity_versions_id = ev.id AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $1 AND e2.published_entity_versions_id IS NOT NULL ORDER BY e.id LIMIT $2",
          "values": Array [
            "37b48706-803e-4227-a51e-8208db12d949",
            26,
          ],
        },
      }
    `);
  });

  test('query bounding box', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        {
          boundingBox: {
            minLat: 55.07,
            maxLat: 56.79,
            minLng: 11.62,
            maxLng: 16.25,
          },
        },
        undefined
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT DISTINCT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev, entity_version_locations evl WHERE e.published_entity_versions_id = ev.id AND ev.id = evl.entity_versions_id AND evl.location && ST_MakeEnvelope($1, $2, $3, $4, 4326) ORDER BY e.id LIMIT $5",
          "values": Array [
            11.62,
            55.07,
            16.25,
            56.79,
            26,
          ],
        },
      }
    `);
  });

  test('query text', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        {
          text: 'foo bar',
        },
        {}
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.published_fts @@ websearch_to_tsquery($1) ORDER BY e.id LIMIT $2",
          "values": Array [
            "foo bar",
            26,
          ],
        },
      }
    `);
  });

  test('query referencing and entity types and paging', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        {
          entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
          referencing: '37b48706-803e-4227-a51e-8208db12d949',
        },
        { first: 10, after: toOpaqueCursor('int', 123) }
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.published_entity_versions_id = ev.id AND e.type = ANY($1) AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $2 AND e2.published_entity_versions_id IS NOT NULL AND e.id > $3 ORDER BY e.id LIMIT $4",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
            "37b48706-803e-4227-a51e-8208db12d949",
            123,
            11,
          ],
        },
      }
    `);
  });

  test('order by createdAt', () => {
    expect(searchPublishedEntitiesQuery(schema, { order: QueryOrder.createdAt }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id ORDER BY e.id LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('order by name', () => {
    expect(searchPublishedEntitiesQuery(schema, { order: QueryOrder.name }, undefined))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id ORDER BY e.name LIMIT $1",
          "values": Array [
            26,
          ],
        },
      }
    `);
  });

  test('Error: invalid entity type in query', () => {
    const result = searchPublishedEntitiesQuery(schema, { entityTypes: ['Invalid'] }, undefined);
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find entity type in query: Invalid');
  });
});

describe('totalAdminEntitiesQuery()', () => {
  test('no query', () => {
    expect(totalAdminEntitiesQuery(schema, undefined)).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e",
          "values": Array [],
        },
      }
    `);
  });

  test('no entity type => all', () => {
    expect(totalAdminEntitiesQuery(schema, { entityTypes: [] })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e",
          "values": Array [],
        },
      }
    `);
  });

  test('one entity type', () => {
    expect(totalAdminEntitiesQuery(schema, { entityTypes: ['QueryGeneratorFoo'] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.type = ANY($1)",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
            ],
          ],
        },
      }
    `);
  });

  test('two entity types', () => {
    expect(
      totalAdminEntitiesQuery(schema, { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.type = ANY($1)",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
          ],
        },
      }
    `);
  });

  test('query status empty list', () => {
    expect(totalAdminEntitiesQuery(schema, { status: [] })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e",
          "values": Array [],
        },
      }
    `);
  });

  test('query status draft', () => {
    expect(totalAdminEntitiesQuery(schema, { status: [EntityPublishState.Draft] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE status = $1",
          "values": Array [
            "draft",
          ],
        },
      }
    `);
  });

  test('query status published', () => {
    expect(totalAdminEntitiesQuery(schema, { status: [EntityPublishState.Published] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE status = $1",
          "values": Array [
            "published",
          ],
        },
      }
    `);
  });

  test('query status modified', () => {
    expect(totalAdminEntitiesQuery(schema, { status: [EntityPublishState.Modified] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE status = $1",
          "values": Array [
            "modified",
          ],
        },
      }
    `);
  });

  test('query status withdrawn', () => {
    expect(totalAdminEntitiesQuery(schema, { status: [EntityPublishState.Withdrawn] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE status = $1",
          "values": Array [
            "withdrawn",
          ],
        },
      }
    `);
  });

  test('query status archived', () => {
    expect(totalAdminEntitiesQuery(schema, { status: [EntityPublishState.Archived] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE status = $1",
          "values": Array [
            "archived",
          ],
        },
      }
    `);
  });

  test('query referencing', () => {
    expect(totalAdminEntitiesQuery(schema, { referencing: '37b48706-803e-4227-a51e-8208db12d949' }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.latest_draft_entity_versions_id = ev.id AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $1",
          "values": Array [
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query referencing and entity types and paging', () => {
    expect(
      totalAdminEntitiesQuery(schema, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
        referencing: '37b48706-803e-4227-a51e-8208db12d949',
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.type = ANY($1) AND e.latest_draft_entity_versions_id = ev.id AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $2",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query bounding box', () => {
    expect(
      totalAdminEntitiesQuery(schema, {
        boundingBox: {
          minLat: 55.07,
          maxLat: 56.79,
          minLng: 11.62,
          maxLng: 16.25,
        },
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(DISTINCT e.id)::integer AS count FROM entities e, entity_versions ev, entity_version_locations evl WHERE e.latest_draft_entity_versions_id = ev.id AND ev.id = evl.entity_versions_id AND evl.location && ST_MakeEnvelope($1, $2, $3, $4, 4326)",
          "values": Array [
            11.62,
            55.07,
            16.25,
            56.79,
          ],
        },
      }
    `);
  });

  test('query text', () => {
    expect(
      totalAdminEntitiesQuery(schema, {
        text: 'foo bar',
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.latest_fts @@ websearch_to_tsquery($1)",
          "values": Array [
            "foo bar",
          ],
        },
      }
    `);
  });
});

describe('totalPublishedEntitiesQuery()', () => {
  test('no query', () => {
    expect(totalPublishedEntitiesQuery(schema, undefined)).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL",
          "values": Array [],
        },
      }
    `);
  });

  test('no entity type => all', () => {
    expect(totalPublishedEntitiesQuery(schema, { entityTypes: [] })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL",
          "values": Array [],
        },
      }
    `);
  });

  test('one entity type', () => {
    expect(totalPublishedEntitiesQuery(schema, { entityTypes: ['QueryGeneratorFoo'] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.type = ANY($1)",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
            ],
          ],
        },
      }
    `);
  });

  test('two entity types', () => {
    expect(
      totalPublishedEntitiesQuery(schema, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.type = ANY($1)",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
          ],
        },
      }
    `);
  });

  test('query referencing', () => {
    expect(
      totalPublishedEntitiesQuery(schema, { referencing: '37b48706-803e-4227-a51e-8208db12d949' })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.published_entity_versions_id IS NOT NULL AND e.published_entity_versions_id = ev.id AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $1 AND e2.published_entity_versions_id IS NOT NULL",
          "values": Array [
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query referencing and entity types and paging', () => {
    expect(
      totalPublishedEntitiesQuery(schema, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
        referencing: '37b48706-803e-4227-a51e-8208db12d949',
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.published_entity_versions_id IS NOT NULL AND e.type = ANY($1) AND e.published_entity_versions_id = ev.id AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $2 AND e2.published_entity_versions_id IS NOT NULL",
          "values": Array [
            Array [
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
            ],
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query bounding box', () => {
    expect(
      totalPublishedEntitiesQuery(schema, {
        boundingBox: {
          minLat: 55.07,
          maxLat: 56.79,
          minLng: 11.62,
          maxLng: 16.25,
        },
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(DISTINCT e.id)::integer AS count FROM entities e, entity_versions ev, entity_version_locations evl WHERE e.published_entity_versions_id IS NOT NULL AND e.published_entity_versions_id = ev.id AND ev.id = evl.entity_versions_id AND evl.location && ST_MakeEnvelope($1, $2, $3, $4, 4326)",
          "values": Array [
            11.62,
            55.07,
            16.25,
            56.79,
          ],
        },
      }
    `);
  });

  test('query text', () => {
    expect(
      totalPublishedEntitiesQuery(schema, {
        text: 'foo bar',
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.published_fts @@ websearch_to_tsquery($1)",
          "values": Array [
            "foo bar",
          ],
        },
      }
    `);
  });
});
