import {
  AdminEntityStatus,
  AdminQueryOrder,
  AdminSchema,
  ErrorType,
  PublishedQueryOrder,
} from '@jonasb/datadata-core';
import { expectErrorResult } from '@jonasb/datadata-core-jest';
import { createMockAdapter } from '../test/TestUtils';
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
    const databaseAdapter = createMockAdapter();
    expect(searchAdminEntitiesQuery(databaseAdapter, schema, undefined, undefined, authKeysNone))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('first 10', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(databaseAdapter, schema, undefined, { first: 10 }, authKeysNone)
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "none",
            11,
          ],
        },
      }
    `);
  });

  test('first 10 after', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        { first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 999) },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id > $2 ORDER BY e.id LIMIT $3",
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
    const databaseAdapter = createMockAdapter();
    expect(searchAdminEntitiesQuery(databaseAdapter, schema, undefined, { last: 10 }, authKeysNone))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id DESC LIMIT $2",
          "values": Array [
            "none",
            11,
          ],
        },
      }
    `);
  });

  test('last 10 before', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        { last: 10, before: toOpaqueCursor(databaseAdapter, 'int', 456) },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id < $2 ORDER BY e.id DESC LIMIT $3",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        {
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id > $2 AND e.id < $3 ORDER BY e.id LIMIT $4",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        {
          last: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id > $2 AND e.id < $3 ORDER BY e.id DESC LIMIT $4",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id DESC LIMIT $2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('query no entity type, i.e. include all', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { entityTypes: [] },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('query one entity type', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.type = ANY($2) ORDER BY e.id LIMIT $3",
          "values": Array [
            "none",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.type = ANY($2) ORDER BY e.id LIMIT $3",
          "values": Array [
            "none",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        { first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 543) },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.type = ANY($2) AND e.id > $3 ORDER BY e.id LIMIT $4",
          "values": Array [
            "none",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(databaseAdapter, schema, { status: [] }, undefined, authKeysNone)
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('query status draft', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND status = $2 ORDER BY e.id LIMIT $3",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND status = $2 ORDER BY e.id LIMIT $3",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND status = $2 ORDER BY e.id LIMIT $3",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND status = $2 ORDER BY e.id LIMIT $3",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND status = $2 ORDER BY e.id LIMIT $3",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND status = ANY($2) ORDER BY e.id LIMIT $3",
          "values": Array [
            "none",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND status = ANY($2) ORDER BY e.id LIMIT $3",
          "values": Array [
            "none",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND status = ANY($2) ORDER BY e.id LIMIT $3",
          "values": Array [
            "none",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $2 ORDER BY e.id LIMIT $3",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev, entity_version_locations evl WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND ev.id = evl.entity_versions_id AND evl.location && ST_MakeEnvelope($2, $3, $4, $5, 4326) ORDER BY e.id LIMIT $6",
          "values": Array [
            "none",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.latest_fts @@ websearch_to_tsquery($2) ORDER BY e.id LIMIT $3",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        {
          entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
          referencing: '37b48706-803e-4227-a51e-8208db12d949',
        },
        { first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 123) },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.type = ANY($2) AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $3 AND e.id > $4 ORDER BY e.id LIMIT $5",
          "values": Array [
            "none",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('order by updatedAt', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.updated LIMIT $2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('order by name', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { order: AdminQueryOrder.name },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.name LIMIT $2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('Error: invalid entity type in query', () => {
    const databaseAdapter = createMockAdapter();
    const result = searchAdminEntitiesQuery(
      databaseAdapter,
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(databaseAdapter, schema, undefined, undefined, authKeysNone)
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('first 10', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(databaseAdapter, schema, undefined, { first: 10 }, authKeysNone)
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "none",
            11,
          ],
        },
      }
    `);
  });

  test('first 10 after', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        {
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 999),
        },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id > $2 ORDER BY e.id LIMIT $3",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { reverse: true },
        {
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 999),
        },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id < $2 ORDER BY e.id DESC LIMIT $3",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(databaseAdapter, schema, undefined, { last: 10 }, authKeysNone)
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id DESC LIMIT $2",
          "values": Array [
            "none",
            11,
          ],
        },
      }
    `);
  });

  test('last 10 before', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        {
          last: 10,
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id < $2 ORDER BY e.id DESC LIMIT $3",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        {
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id > $2 AND e.id < $3 ORDER BY e.id LIMIT $4",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { reverse: true },
        {
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id < $2 AND e.id > $3 ORDER BY e.id DESC LIMIT $4",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        {
          last: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": false,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id > $2 AND e.id < $3 ORDER BY e.id DESC LIMIT $4",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id DESC LIMIT $2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('query no entity type, i.e. include all', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { entityTypes: [] },
        undefined,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 25,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('query one entity type', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.type = ANY($2) ORDER BY e.id LIMIT $3",
          "values": Array [
            "none",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.type = ANY($2) ORDER BY e.id LIMIT $3",
          "values": Array [
            "none",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        { first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 543) },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.type = ANY($2) AND e.id > $3 ORDER BY e.id LIMIT $4",
          "values": Array [
            "none",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $2 AND e2.published_entity_versions_id IS NOT NULL ORDER BY e.id LIMIT $3",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev, entity_version_locations evl WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND ev.id = evl.entity_versions_id AND evl.location && ST_MakeEnvelope($2, $3, $4, $5, 4326) ORDER BY e.id LIMIT $6",
          "values": Array [
            "none",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.published_fts @@ websearch_to_tsquery($2) ORDER BY e.id LIMIT $3",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        {
          entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
          referencing: '37b48706-803e-4227-a51e-8208db12d949',
        },
        { first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 123) },
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "isForwards": true,
          "pagingCount": 10,
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.type = ANY($2) AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $3 AND e2.published_entity_versions_id IS NOT NULL AND e.id > $4 ORDER BY e.id LIMIT $5",
          "values": Array [
            "none",
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
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('order by name', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
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
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.name LIMIT $2",
          "values": Array [
            "none",
            26,
          ],
        },
      }
    `);
  });

  test('Error: invalid entity type in query', () => {
    const databaseAdapter = createMockAdapter();
    const result = searchPublishedEntitiesQuery(
      databaseAdapter,
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
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.resolved_auth_key = $1",
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
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.resolved_auth_key = $1",
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
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.resolved_auth_key = $1 AND e.type = ANY($2)",
          "values": Array [
            "none",
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
      totalAdminEntitiesQuery(schema, authKeysNone, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.resolved_auth_key = $1 AND e.type = ANY($2)",
          "values": Array [
            "none",
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
    expect(totalAdminEntitiesQuery(schema, authKeysNone, { status: [] })).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.resolved_auth_key = $1",
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
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.resolved_auth_key = $1 AND status = $2",
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
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.resolved_auth_key = $1 AND status = $2",
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
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.resolved_auth_key = $1 AND status = $2",
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
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.resolved_auth_key = $1 AND status = $2",
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
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.resolved_auth_key = $1 AND status = $2",
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
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $2",
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
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.type = ANY($2) AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $3",
          "values": Array [
            "none",
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
          "text": "SELECT COUNT(DISTINCT e.id)::integer AS count FROM entities e, entity_versions ev, entity_version_locations evl WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND ev.id = evl.entity_versions_id AND evl.location && ST_MakeEnvelope($2, $3, $4, $5, 4326)",
          "values": Array [
            "none",
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
      totalAdminEntitiesQuery(schema, authKeysNone, {
        text: 'foo bar',
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.resolved_auth_key = $1 AND e.latest_fts @@ websearch_to_tsquery($2)",
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
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = $1",
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
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = $1",
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
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = $1 AND e.type = ANY($2)",
          "values": Array [
            "none",
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
      totalPublishedEntitiesQuery(schema, authKeysNone, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = $1 AND e.type = ANY($2)",
          "values": Array [
            "none",
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
      totalPublishedEntitiesQuery(schema, authKeysNone, {
        referencing: '37b48706-803e-4227-a51e-8208db12d949',
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $2 AND e2.published_entity_versions_id IS NOT NULL",
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
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.type = ANY($2) AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $3 AND e2.published_entity_versions_id IS NOT NULL",
          "values": Array [
            "none",
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
          "text": "SELECT COUNT(DISTINCT e.id)::integer AS count FROM entities e, entity_versions ev, entity_version_locations evl WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND ev.id = evl.entity_versions_id AND evl.location && ST_MakeEnvelope($2, $3, $4, $5, 4326)",
          "values": Array [
            "none",
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
      totalPublishedEntitiesQuery(schema, authKeysNone, {
        text: 'foo bar',
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = $1 AND e.published_fts @@ websearch_to_tsquery($2)",
          "values": Array [
            "none",
            "foo bar",
          ],
        },
      }
    `);
  });
});
