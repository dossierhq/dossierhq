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
import { resolvePaging } from './Paging';
import {
  sampleAdminEntitiesQuery,
  samplePublishedEntitiesQuery,
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
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
            "values": Array [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('first 10', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({ first: 10 }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
            "values": Array [
              "none",
              11,
            ],
          },
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
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 999),
        }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id > $2 ORDER BY e.id LIMIT $3",
            "values": Array [
              "none",
              999,
              11,
            ],
          },
        },
      }
    `);
  });

  test('last 10', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({ last: 10 }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id DESC LIMIT $2",
            "values": Array [
              "none",
              11,
            ],
          },
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
        resolvePaging({
          last: 10,
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id < $2 ORDER BY e.id DESC LIMIT $3",
            "values": Array [
              "none",
              456,
              11,
            ],
          },
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
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id > $2 AND e.id < $3 ORDER BY e.id LIMIT $4",
            "values": Array [
              "none",
              123,
              456,
              11,
            ],
          },
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
        resolvePaging({
          last: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id > $2 AND e.id < $3 ORDER BY e.id DESC LIMIT $4",
            "values": Array [
              "none",
              123,
              456,
              11,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id DESC LIMIT $2",
            "values": Array [
              "none",
              26,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
            "values": Array [
              "none",
              26,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
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
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 543),
        }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
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
        },
      }
    `);
  });

  test('query status empty list', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { status: [] },
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
            "values": Array [
              "none",
              26,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND status = $2 ORDER BY e.id LIMIT $3",
            "values": Array [
              "none",
              "draft",
              26,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND status = $2 ORDER BY e.id LIMIT $3",
            "values": Array [
              "none",
              "published",
              26,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND status = $2 ORDER BY e.id LIMIT $3",
            "values": Array [
              "none",
              "modified",
              26,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND status = $2 ORDER BY e.id LIMIT $3",
            "values": Array [
              "none",
              "withdrawn",
              26,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND status = $2 ORDER BY e.id LIMIT $3",
            "values": Array [
              "none",
              "archived",
              26,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
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

        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
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
        },
      }
    `);
  });

  test('query linksFrom', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { linksFrom: { id: '37b48706-803e-4227-a51e-8208db12d949' } },
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev, entities e_from, entity_version_references evr_from WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e_from.uuid = $2 AND e_from.latest_draft_entity_versions_id = evr_from.entity_versions_id AND evr_from.entities_id = e.id ORDER BY e.id LIMIT $3",
            "values": Array [
              "none",
              "37b48706-803e-4227-a51e-8208db12d949",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query linksTo', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' } },
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $2 ORDER BY e.id LIMIT $3",
            "values": Array [
              "none",
              "37b48706-803e-4227-a51e-8208db12d949",
              26,
            ],
          },
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

        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
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

        resolvePaging({}).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.latest_fts @@ websearch_to_tsquery($2) ORDER BY e.id LIMIT $3",
            "values": Array [
              "none",
              "foo bar",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query linksTo and entity types and paging', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        {
          entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
          linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
        },

        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
        }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
            "values": Array [
              "none",
              26,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.updated LIMIT $2",
            "values": Array [
              "none",
              26,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.name LIMIT $2",
            "values": Array [
              "none",
              26,
            ],
          },
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
      resolvePaging(undefined).valueOrThrow(),
      authKeysNone
    );
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find entity type in query: Invalid');
  });
});

describe('searchPublishedEntitiesQuery()', () => {
  test('default paging', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
            "values": Array [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('first 10', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({ first: 10 }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
            "values": Array [
              "none",
              11,
            ],
          },
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
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 999),
        }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id > $2 ORDER BY e.id LIMIT $3",
            "values": Array [
              "none",
              999,
              11,
            ],
          },
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
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 999),
        }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id < $2 ORDER BY e.id DESC LIMIT $3",
            "values": Array [
              "none",
              999,
              11,
            ],
          },
        },
      }
    `);
  });

  test('last 10', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({ last: 10 }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id DESC LIMIT $2",
            "values": Array [
              "none",
              11,
            ],
          },
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
        resolvePaging({
          last: 10,
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id < $2 ORDER BY e.id DESC LIMIT $3",
            "values": Array [
              "none",
              456,
              11,
            ],
          },
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
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id > $2 AND e.id < $3 ORDER BY e.id LIMIT $4",
            "values": Array [
              "none",
              123,
              456,
              11,
            ],
          },
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
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id < $2 AND e.id > $3 ORDER BY e.id DESC LIMIT $4",
            "values": Array [
              "none",
              123,
              456,
              11,
            ],
          },
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
        resolvePaging({
          last: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id > $2 AND e.id < $3 ORDER BY e.id DESC LIMIT $4",
            "values": Array [
              "none",
              123,
              456,
              11,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id DESC LIMIT $2",
            "values": Array [
              "none",
              26,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
            "values": Array [
              "none",
              26,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.type = ANY($2) ORDER BY e.id LIMIT $3",
            "values": Array [
              "none",
              Array [
                "QueryGeneratorFoo",
              ],
              26,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
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
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 543),
        }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
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
        },
      }
    `);
  });

  test('query linksFrom', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { linksFrom: { id: '37b48706-803e-4227-a51e-8208db12d949' } },
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev, entities e_from, entity_version_references evr_from WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e_from.uuid = $2 AND e_from.published_entity_versions_id = evr_from.entity_versions_id AND evr_from.entities_id = e.id ORDER BY e.id LIMIT $3",
            "values": Array [
              "none",
              "37b48706-803e-4227-a51e-8208db12d949",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query linksTo', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' } },
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev, entity_version_references evr, entities e2 WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND ev.id = evr.entity_versions_id AND evr.entities_id = e2.id AND e2.uuid = $2 AND e2.published_entity_versions_id IS NOT NULL ORDER BY e.id LIMIT $3",
            "values": Array [
              "none",
              "37b48706-803e-4227-a51e-8208db12d949",
              26,
            ],
          },
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

        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
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

        resolvePaging({}).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.published_fts @@ websearch_to_tsquery($2) ORDER BY e.id LIMIT $3",
            "values": Array [
              "none",
              "foo bar",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query linksTi and entity types and paging', () => {
    const databaseAdapter = createMockAdapter();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        {
          entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
          linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
        },

        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
        }).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
            "values": Array [
              "none",
              26,
            ],
          },
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
        resolvePaging(undefined).valueOrThrow(),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "cursorExtractor": [Function],
          "sqlQuery": Object {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.name LIMIT $2",
            "values": Array [
              "none",
              26,
            ],
          },
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
      resolvePaging(undefined).valueOrThrow(),
      authKeysNone
    );
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find entity type in query: Invalid');
  });
});

describe('sampleAdminEntitiesQuery()', () => {
  test('no query', () => {
    expect(sampleAdminEntitiesQuery(schema, undefined, 5, 10, authKeysNone)).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.uuid LIMIT $2 OFFSET $3",
          "values": Array [
            "none",
            10,
            5,
          ],
        },
      }
    `);
  });

  test('entityType', () => {
    expect(
      sampleAdminEntitiesQuery(schema, { entityTypes: ['QueryGeneratorFoo'] }, 5, 10, authKeysNone)
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.type = ANY($2) ORDER BY e.uuid LIMIT $3 OFFSET $4",
          "values": Array [
            "none",
            Array [
              "QueryGeneratorFoo",
            ],
            10,
            5,
          ],
        },
      }
    `);
  });
});

describe('samplePublishedEntitiesQuery()', () => {
  test('no query', () => {
    expect(samplePublishedEntitiesQuery(schema, undefined, 5, 10, authKeysNone))
      .toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.uuid LIMIT $2 OFFSET $3",
          "values": Array [
            "none",
            10,
            5,
          ],
        },
      }
    `);
  });

  test('entityType', () => {
    expect(
      samplePublishedEntitiesQuery(
        schema,
        { entityTypes: ['QueryGeneratorFoo'] },
        5,
        10,
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.type = ANY($2) ORDER BY e.uuid LIMIT $3 OFFSET $4",
          "values": Array [
            "none",
            Array [
              "QueryGeneratorFoo",
            ],
            10,
            5,
          ],
        },
      }
    `);
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

  test('query linksFrom', () => {
    expect(
      totalAdminEntitiesQuery(schema, authKeysNone, {
        linksFrom: { id: '37b48706-803e-4227-a51e-8208db12d949' },
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e, entities e_from, entity_version_references evr_from WHERE e.resolved_auth_key = $1 AND e_from.uuid = $2 AND e_from.latest_draft_entity_versions_id = evr_from.entity_versions_id AND evr_from.entities_id = e.id",
          "values": Array [
            "none",
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query linksTo', () => {
    expect(
      totalAdminEntitiesQuery(schema, authKeysNone, {
        linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
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

  test('query linksTo and entity types and paging', () => {
    expect(
      totalAdminEntitiesQuery(schema, authKeysNone, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
        linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
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

  test('query linksFrom', () => {
    expect(
      totalPublishedEntitiesQuery(schema, authKeysNone, {
        linksFrom: { id: '37b48706-803e-4227-a51e-8208db12d949' },
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "text": "SELECT COUNT(e.id)::integer AS count FROM entities e, entities e_from, entity_version_references evr_from WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = $1 AND e_from.uuid = $2 AND e_from.published_entity_versions_id = evr_from.entity_versions_id AND evr_from.entities_id = e.id",
          "values": Array [
            "none",
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query linksTo', () => {
    expect(
      totalPublishedEntitiesQuery(schema, authKeysNone, {
        linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
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

  test('query linksTo and entity types and paging', () => {
    expect(
      totalPublishedEntitiesQuery(schema, authKeysNone, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
        linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
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
