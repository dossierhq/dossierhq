import {
  AdminEntityStatus,
  AdminQueryOrder,
  AdminSchema,
  ErrorType,
  PublishedQueryOrder,
} from '@jonasb/datadata-core';
import { expectErrorResult } from '@jonasb/datadata-core-jest';
import { toOpaqueCursor } from './OpaqueCursor';
import {
  searchAdminEntitiesQuery,
  searchPublishedEntitiesQuery,
  totalAdminEntitiesQuery,
  totalPublishedEntitiesQuery,
} from './QueryGenerator';

const schema = new AdminSchema({
  entityTypes: [
    { name: 'QueryGeneratorFoo', adminOnly: false, fields: [] },
    { name: 'QueryGeneratorBar', adminOnly: false, fields: [] },
  ],
  valueTypes: [],
});

const authKeysNone = [{ authKey: 'none', resolvedAuthKey: 'none' }];

describe('searchAdminEntitiesQuery()', () => {
  test('default paging', () => {
    expect(searchAdminEntitiesQuery(schema, undefined, undefined, authKeysNone))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('first 10', () => {
    expect(searchAdminEntitiesQuery(schema, undefined, { first: 10 }, authKeysNone))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
          "values": Array [
            "none",
            11,
          ],
        },
      }
    `);
  });

  test('first 10 after', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        undefined,
        { first: 10, after: toOpaqueCursor('int', 999) },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id > ?2 ORDER BY e.id LIMIT ?3",
          "values": Array [
            "none",
            999,
            11,
          ],
        },
      }
    `);
  });

  test('last 10', () => {
    expect(searchAdminEntitiesQuery(schema, undefined, { last: 10 }, authKeysNone))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2",
          "values": Array [
            "none",
            11,
          ],
        },
      }
    `);
  });

  test('last 10 before', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        undefined,
        { last: 10, before: toOpaqueCursor('int', 456) },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id DESC LIMIT ?3",
          "values": Array [
            "none",
            456,
            11,
          ],
        },
      }
    `);
  });

  test('first 10 between after and before', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        undefined,
        {
          first: 10,
          after: toOpaqueCursor('int', 123),
          before: toOpaqueCursor('int', 456),
        },

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id LIMIT ?4",
          "values": Array [
            "none",
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
      searchAdminEntitiesQuery(
        schema,
        undefined,
        {
          last: 10,
          after: toOpaqueCursor('int', 123),
          before: toOpaqueCursor('int', 456),
        },

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id DESC LIMIT ?4",
          "values": Array [
            "none",
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
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('query no entity type, i.e. include all', () => {
    expect(searchAdminEntitiesQuery(schema, { entityTypes: [] }, undefined, authKeysNone))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('query one entity type', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        { entityTypes: ['QueryGeneratorFoo'] },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2) ORDER BY e.id LIMIT ?3",
          "values": Array [
            "none",
            "QueryGeneratorFoo",
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
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) ORDER BY e.id LIMIT ?4",
          "values": Array [
            "none",
            "QueryGeneratorFoo",
            "QueryGeneratorBar",
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
        { first: 10, after: toOpaqueCursor('int', 543) },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id > ?4 ORDER BY e.id LIMIT ?5",
          "values": Array [
            "none",
            "QueryGeneratorFoo",
            "QueryGeneratorBar",
            543,
            11,
          ],
        },
      }
    `);
  });

  test('query status empty list', () => {
    expect(searchAdminEntitiesQuery(schema, { status: [] }, undefined, authKeysNone))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('query status draft', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        { status: [AdminEntityStatus.draft] },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3",
          "values": Array [
            "none",
            "draft",
            26,
          ],
        },
      }
    `);
  });

  test('query status published', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        { status: [AdminEntityStatus.published] },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3",
          "values": Array [
            "none",
            "published",
            26,
          ],
        },
      }
    `);
  });

  test('query status modified', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        { status: [AdminEntityStatus.modified] },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3",
          "values": Array [
            "none",
            "modified",
            26,
          ],
        },
      }
    `);
  });

  test('query status withdrawn', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        { status: [AdminEntityStatus.withdrawn] },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3",
          "values": Array [
            "none",
            "withdrawn",
            26,
          ],
        },
      }
    `);
  });

  test('query status archived', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        { status: [AdminEntityStatus.archived] },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3",
          "values": Array [
            "none",
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
        { status: [AdminEntityStatus.draft, AdminEntityStatus.published] },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status IN (?2, ?3) ORDER BY e.id LIMIT ?4",
          "values": Array [
            "none",
            "draft",
            "published",
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
        { status: [AdminEntityStatus.draft, AdminEntityStatus.archived] },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status IN (?2, ?3) ORDER BY e.id LIMIT ?4",
          "values": Array [
            "none",
            "draft",
            "archived",
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
            AdminEntityStatus.draft,
            AdminEntityStatus.published,
            AdminEntityStatus.modified,
            AdminEntityStatus.archived,
            AdminEntityStatus.withdrawn,
          ],
        },

        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status IN (?2, ?3, ?4, ?5, ?6) ORDER BY e.id LIMIT ?7",
          "values": Array [
            "none",
            "draft",
            "published",
            "modified",
            "archived",
            "withdrawn",
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
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = ?2 ORDER BY e.id LIMIT ?3",
          "values": Array [
            "none",
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

        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev, entity_version_locations evl WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND ev.id = evl.entity_versions_id AND evl.lat >= ?2 AND evl.lat <= ?3 AND evl.lng >= ?4 AND evl.lng <= ?5 ORDER BY e.id LIMIT ?6",
          "values": Array [
            "none",
            55.07,
            56.79,
            11.62,
            16.25,
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

        {},
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.latest_fts @@ websearch_to_tsquery(?2) ORDER BY e.id LIMIT ?3",
          "values": Array [
            "none",
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

        { first: 10, after: toOpaqueCursor('int', 123) },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = ?4 AND e.id > ?5 ORDER BY e.id LIMIT ?6",
          "values": Array [
            "none",
            "QueryGeneratorFoo",
            "QueryGeneratorBar",
            "37b48706-803e-4227-a51e-8208db12d949",
            123,
            11,
          ],
        },
      }
    `);
  });

  test('order by createdAt', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        { order: AdminQueryOrder.createdAt },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('order by updatedAt', () => {
    expect(
      searchAdminEntitiesQuery(
        schema,
        { order: AdminQueryOrder.updatedAt },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('order by name', () => {
    expect(
      searchAdminEntitiesQuery(schema, { order: AdminQueryOrder.name }, undefined, authKeysNone)
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.name LIMIT ?2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('Error: invalid entity type in query', () => {
    const result = searchAdminEntitiesQuery(
      schema,
      { entityTypes: ['Invalid'] },
      undefined,
      authKeysNone
    );
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find entity type in query: Invalid');
  });
});

describe('searchPublishedEntitiesQuery()', () => {
  test('default paging', () => {
    expect(searchPublishedEntitiesQuery(schema, undefined, undefined, authKeysNone))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('first 10', () => {
    expect(searchPublishedEntitiesQuery(schema, undefined, { first: 10 }, authKeysNone))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
          "values": Array [
            "none",
            11,
          ],
        },
      }
    `);
  });

  test('first 10 after', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        undefined,
        {
          first: 10,
          after: toOpaqueCursor('int', 999),
        },

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id > ?2 ORDER BY e.id LIMIT ?3",
          "values": Array [
            "none",
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
        },

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id DESC LIMIT ?3",
          "values": Array [
            "none",
            999,
            11,
          ],
        },
      }
    `);
  });

  test('last 10', () => {
    expect(searchPublishedEntitiesQuery(schema, undefined, { last: 10 }, authKeysNone))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2",
          "values": Array [
            "none",
            11,
          ],
        },
      }
    `);
  });

  test('last 10 before', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        undefined,
        {
          last: 10,
          before: toOpaqueCursor('int', 456),
        },

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id DESC LIMIT ?3",
          "values": Array [
            "none",
            456,
            11,
          ],
        },
      }
    `);
  });

  test('first 10 between after and before', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        undefined,
        {
          first: 10,
          after: toOpaqueCursor('int', 123),
          before: toOpaqueCursor('int', 456),
        },

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id LIMIT ?4",
          "values": Array [
            "none",
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
        },

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id < ?2 AND e.id > ?3 ORDER BY e.id DESC LIMIT ?4",
          "values": Array [
            "none",
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
      searchPublishedEntitiesQuery(
        schema,
        undefined,
        {
          last: 10,
          after: toOpaqueCursor('int', 123),
          before: toOpaqueCursor('int', 456),
        },

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id DESC LIMIT ?4",
          "values": Array [
            "none",
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
        { order: PublishedQueryOrder.createdAt, reverse: true },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('query no entity type, i.e. include all', () => {
    expect(searchPublishedEntitiesQuery(schema, { entityTypes: [] }, undefined, authKeysNone))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('query one entity type', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        { entityTypes: ['QueryGeneratorFoo'] },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2) ORDER BY e.id LIMIT ?3",
          "values": Array [
            "none",
            "QueryGeneratorFoo",
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
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) ORDER BY e.id LIMIT ?4",
          "values": Array [
            "none",
            "QueryGeneratorFoo",
            "QueryGeneratorBar",
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
        { first: 10, after: toOpaqueCursor('int', 543) },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id > ?4 ORDER BY e.id LIMIT ?5",
          "values": Array [
            "none",
            "QueryGeneratorFoo",
            "QueryGeneratorBar",
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
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = ?2 AND e2.published_entity_versions_id IS NOT NULL ORDER BY e.id LIMIT ?3",
          "values": Array [
            "none",
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

        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev, entity_version_locations evl WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND ev.id = evl.entity_versions_id AND evl.lat >= ?2 AND evl.lat <= ?3 AND evl.lng >= ?4 AND evl.lng <= ?5 ORDER BY e.id LIMIT ?6",
          "values": Array [
            "none",
            55.07,
            56.79,
            11.62,
            16.25,
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

        {},
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.published_fts @@ websearch_to_tsquery(?2) ORDER BY e.id LIMIT ?3",
          "values": Array [
            "none",
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

        { first: 10, after: toOpaqueCursor('int', 123) },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = ?4 AND e2.published_entity_versions_id IS NOT NULL AND e.id > ?5 ORDER BY e.id LIMIT ?6",
          "values": Array [
            "none",
            "QueryGeneratorFoo",
            "QueryGeneratorBar",
            "37b48706-803e-4227-a51e-8208db12d949",
            123,
            11,
          ],
        },
      }
    `);
  });

  test('order by createdAt', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        { order: PublishedQueryOrder.createdAt },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('order by name', () => {
    expect(
      searchPublishedEntitiesQuery(
        schema,
        { order: PublishedQueryOrder.name },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.name LIMIT ?2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('Error: invalid entity type in query', () => {
    const result = searchPublishedEntitiesQuery(
      schema,
      { entityTypes: ['Invalid'] },
      undefined,
      authKeysNone
    );
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find entity type in query: Invalid');
  });
});

describe('totalAdminEntitiesQuery()', () => {
  test('no query', () => {
    expect(totalAdminEntitiesQuery(schema, authKeysNone, undefined)).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1",
          "values": Array [
            "none",
          ],
        },
      }
    `);
  });

  test('no entity type => all', () => {
    expect(totalAdminEntitiesQuery(schema, authKeysNone, { entityTypes: [] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1",
          "values": Array [
            "none",
          ],
        },
      }
    `);
  });

  test('one entity type', () => {
    expect(totalAdminEntitiesQuery(schema, authKeysNone, { entityTypes: ['QueryGeneratorFoo'] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND e.type IN (?2)",
          "values": Array [
            "none",
            "QueryGeneratorFoo",
          ],
        },
      }
    `);
  });

  test('two entity types', () => {
    expect(
      totalAdminEntitiesQuery(schema, authKeysNone, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND e.type IN (?2, ?3)",
          "values": Array [
            "none",
            "QueryGeneratorFoo",
            "QueryGeneratorBar",
          ],
        },
      }
    `);
  });

  test('query status empty list', () => {
    expect(totalAdminEntitiesQuery(schema, authKeysNone, { status: [] })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1",
          "values": Array [
            "none",
          ],
        },
      }
    `);
  });

  test('query status draft', () => {
    expect(totalAdminEntitiesQuery(schema, authKeysNone, { status: [AdminEntityStatus.draft] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
          "values": Array [
            "none",
            "draft",
          ],
        },
      }
    `);
  });

  test('query status published', () => {
    expect(totalAdminEntitiesQuery(schema, authKeysNone, { status: [AdminEntityStatus.published] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
          "values": Array [
            "none",
            "published",
          ],
        },
      }
    `);
  });

  test('query status modified', () => {
    expect(totalAdminEntitiesQuery(schema, authKeysNone, { status: [AdminEntityStatus.modified] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
          "values": Array [
            "none",
            "modified",
          ],
        },
      }
    `);
  });

  test('query status withdrawn', () => {
    expect(totalAdminEntitiesQuery(schema, authKeysNone, { status: [AdminEntityStatus.withdrawn] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
          "values": Array [
            "none",
            "withdrawn",
          ],
        },
      }
    `);
  });

  test('query status archived', () => {
    expect(totalAdminEntitiesQuery(schema, authKeysNone, { status: [AdminEntityStatus.archived] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
          "values": Array [
            "none",
            "archived",
          ],
        },
      }
    `);
  });

  test('query referencing', () => {
    expect(
      totalAdminEntitiesQuery(schema, authKeysNone, {
        referencing: '37b48706-803e-4227-a51e-8208db12d949',
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.resolved_auth_key = ?1 AND e.latest_entity_versions_id = ev.id AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = ?2",
          "values": Array [
            "none",
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query referencing and entity types and paging', () => {
    expect(
      totalAdminEntitiesQuery(schema, authKeysNone, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
        referencing: '37b48706-803e-4227-a51e-8208db12d949',
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.latest_entity_versions_id = ev.id AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = ?4",
          "values": Array [
            "none",
            "QueryGeneratorFoo",
            "QueryGeneratorBar",
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query bounding box', () => {
    expect(
      totalAdminEntitiesQuery(schema, authKeysNone, {
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
          "text": "SELECT COUNT(DISTINCT e.id) AS count FROM entities e, entity_versions ev, entity_version_locations evl WHERE e.resolved_auth_key = ?1 AND e.latest_entity_versions_id = ev.id AND ev.id = evl.entity_versions_id AND evl.lat >= ?2 AND evl.lat <= ?3 AND evl.lng >= ?4 AND evl.lng <= ?5",
          "values": Array [
            "none",
            55.07,
            56.79,
            11.62,
            16.25,
          ],
        },
      }
    `);
  });

  test('query text', () => {
    expect(
      totalAdminEntitiesQuery(schema, authKeysNone, {
        text: 'foo bar',
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND e.latest_fts @@ websearch_to_tsquery(?2)",
          "values": Array [
            "none",
            "foo bar",
          ],
        },
      }
    `);
  });
});

describe('totalPublishedEntitiesQuery()', () => {
  test('no query', () => {
    expect(totalPublishedEntitiesQuery(schema, authKeysNone, undefined)).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1",
          "values": Array [
            "none",
          ],
        },
      }
    `);
  });

  test('no entity type => all', () => {
    expect(totalPublishedEntitiesQuery(schema, authKeysNone, { entityTypes: [] }))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1",
          "values": Array [
            "none",
          ],
        },
      }
    `);
  });

  test('one entity type', () => {
    expect(
      totalPublishedEntitiesQuery(schema, authKeysNone, { entityTypes: ['QueryGeneratorFoo'] })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2)",
          "values": Array [
            "none",
            "QueryGeneratorFoo",
          ],
        },
      }
    `);
  });

  test('two entity types', () => {
    expect(
      totalPublishedEntitiesQuery(schema, authKeysNone, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3)",
          "values": Array [
            "none",
            "QueryGeneratorFoo",
            "QueryGeneratorBar",
          ],
        },
      }
    `);
  });

  test('query referencing', () => {
    expect(
      totalPublishedEntitiesQuery(schema, authKeysNone, {
        referencing: '37b48706-803e-4227-a51e-8208db12d949',
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.published_entity_versions_id = ev.id AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = ?2 AND e2.published_entity_versions_id IS NOT NULL",
          "values": Array [
            "none",
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query referencing and entity types and paging', () => {
    expect(
      totalPublishedEntitiesQuery(schema, authKeysNone, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
        referencing: '37b48706-803e-4227-a51e-8208db12d949',
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.published_entity_versions_id = ev.id AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = ?4 AND e2.published_entity_versions_id IS NOT NULL",
          "values": Array [
            "none",
            "QueryGeneratorFoo",
            "QueryGeneratorBar",
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query bounding box', () => {
    expect(
      totalPublishedEntitiesQuery(schema, authKeysNone, {
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
          "text": "SELECT COUNT(DISTINCT e.id) AS count FROM entities e, entity_versions ev, entity_version_locations evl WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.published_entity_versions_id = ev.id AND ev.id = evl.entity_versions_id AND evl.lat >= ?2 AND evl.lat <= ?3 AND evl.lng >= ?4 AND evl.lng <= ?5",
          "values": Array [
            "none",
            55.07,
            56.79,
            11.62,
            16.25,
          ],
        },
      }
    `);
  });

  test('query text', () => {
    expect(
      totalPublishedEntitiesQuery(schema, authKeysNone, {
        text: 'foo bar',
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.published_fts @@ websearch_to_tsquery(?2)",
          "values": Array [
            "none",
            "foo bar",
          ],
        },
      }
    `);
  });
});
