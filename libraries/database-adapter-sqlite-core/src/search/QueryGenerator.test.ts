import {
  AdminEntityStatus,
  AdminQueryOrder,
  AdminSchema,
  ErrorType,
  PublishedQueryOrder,
} from '@jonasb/datadata-core';
import { expectErrorResult } from '@jonasb/datadata-core-vitest';
import { describe, expect, test } from 'vitest';
import { createMockDatabase, resolvePaging } from '../test/TestUtils.js';
import { toOpaqueCursor } from './OpaqueCursor.js';
import {
  sampleAdminEntitiesQuery,
  samplePublishedEntitiesQuery,
  searchAdminEntitiesQuery,
  searchPublishedEntitiesQuery,
  totalAdminEntitiesQuery,
  totalPublishedEntitiesQuery,
} from './QueryGenerator.js';

const schema = AdminSchema.createAndValidate({
  entityTypes: [
    { name: 'QueryGeneratorFoo', fields: [] },
    { name: 'QueryGeneratorBar', fields: [] },
  ],
}).valueOrThrow();

const authKeysNone = [{ authKey: 'none', resolvedAuthKey: 'none' }];

describe('searchAdminEntitiesQuery()', () => {
  test('default paging', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('first 10', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({ first: 10 }),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
            "values": [
              "none",
              11,
            ],
          },
        },
      }
    `);
  });

  test('first 10 after', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({ first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 999) }),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id > ?2 ORDER BY e.id LIMIT ?3",
            "values": [
              "none",
              999,
              11,
            ],
          },
        },
      }
    `);
  });

  test('first 10 after (inclusive)', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging(
          { first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 999) },
          { afterInclusive: true }
        ),

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id >= ?2 ORDER BY e.id LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({ last: 10 }),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2",
            "values": [
              "none",
              11,
            ],
          },
        },
      }
    `);
  });

  test('last 10 before', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({ last: 10, before: toOpaqueCursor(databaseAdapter, 'int', 456) }),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id DESC LIMIT ?3",
            "values": [
              "none",
              456,
              11,
            ],
          },
        },
      }
    `);
  });

  test('last 10 before (inclusive)', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging(
          { last: 10, before: toOpaqueCursor(databaseAdapter, 'int', 456) },
          { beforeInclusive: true }
        ),

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id <= ?2 ORDER BY e.id DESC LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }),

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id LIMIT ?4",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({
          last: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }),

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id DESC LIMIT ?4",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { order: AdminQueryOrder.createdAt, reverse: true },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query no entity type, i.e. include all', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { entityTypes: [] },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query one entity type', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { entityTypes: ['QueryGeneratorFoo'] },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2) ORDER BY e.id LIMIT ?3",
            "values": [
              "none",
              "QueryGeneratorFoo",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query two entity types', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) ORDER BY e.id LIMIT ?4",
            "values": [
              "none",
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query two entity types, first and after', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        resolvePaging({ first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 543) }),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id > ?4 ORDER BY e.id LIMIT ?5",
            "values": [
              "none",
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
              543,
              11,
            ],
          },
        },
      }
    `);
  });

  test('query status empty list', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { status: [] },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query status draft', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { status: [AdminEntityStatus.draft] },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { status: [AdminEntityStatus.published] },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { status: [AdminEntityStatus.modified] },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { status: [AdminEntityStatus.withdrawn] },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { status: [AdminEntityStatus.archived] },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { status: [AdminEntityStatus.draft, AdminEntityStatus.published] },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status IN (?2, ?3) ORDER BY e.id LIMIT ?4",
            "values": [
              "none",
              "draft",
              "published",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query status draft+archived', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { status: [AdminEntityStatus.draft, AdminEntityStatus.archived] },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status IN (?2, ?3) ORDER BY e.id LIMIT ?4",
            "values": [
              "none",
              "draft",
              "archived",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query status all', () => {
    const databaseAdapter = createMockDatabase();
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

        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND status IN (?2, ?3, ?4, ?5, ?6) ORDER BY e.id LIMIT ?7",
            "values": [
              "none",
              "draft",
              "published",
              "modified",
              "archived",
              "withdrawn",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query linksFrom', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { linksFrom: { id: '37b48706-803e-4227-a51e-8208db12d949' } },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev, entities e_from, entity_latest_references er_from WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e_from.uuid = ?2 AND e_from.id = er_from.from_entities_id AND er_from.to_entities_id = e.id ORDER BY e.id LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' } },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev, entity_latest_references er_to, entities e_to WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?2 ORDER BY e.id LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
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

        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev, entity_latest_locations el WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND el.lng >= ?4 AND el.lng <= ?5 ORDER BY e.id LIMIT ?6",
            "values": [
              "none",
              55.07,
              56.79,
              11.62,
              16.25,
              26,
            ],
          },
        },
      }
    `);
  });

  test('query bounding box (wrapping 180/-180 lng)', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { boundingBox: { minLat: 55.07, maxLat: 56.79, minLng: 179, maxLng: -179 } },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev, entity_latest_locations el WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND (el.lng <= ?4 OR el.lng >= ?5) ORDER BY e.id LIMIT ?6",
            "values": [
              "none",
              55.07,
              56.79,
              179,
              -179,
              26,
            ],
          },
        },
      }
    `);
  });

  test('query text', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { text: 'foo bar' },
        resolvePaging({}),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev, entities_latest_fts fts WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND fts.content match ?2 AND fts.docid = e.id ORDER BY e.id LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        {
          entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
          linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
        },

        resolvePaging({ first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 123) }),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev, entity_latest_references er_to, entities e_to WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?4 AND e.id > ?5 ORDER BY e.id LIMIT ?6",
            "values": [
              "none",
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { order: AdminQueryOrder.createdAt },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('order by updatedAt', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { order: AdminQueryOrder.updatedAt },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.updated_seq LIMIT ?2",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('order by name', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        schema,
        { order: AdminQueryOrder.name },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.name LIMIT ?2",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('Error: invalid entity type in query', () => {
    const databaseAdapter = createMockDatabase();
    const result = searchAdminEntitiesQuery(
      databaseAdapter,
      schema,
      { entityTypes: ['Invalid'] },
      resolvePaging(undefined),
      authKeysNone
    );
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find entity type in query: Invalid');
  });
});

describe('searchPublishedEntitiesQuery()', () => {
  test('default paging', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('first 10', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({ first: 10 }),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
            "values": [
              "none",
              11,
            ],
          },
        },
      }
    `);
  });

  test('first 10 after', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 999),
        }),

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id > ?2 ORDER BY e.id LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { reverse: true },
        resolvePaging({ first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 999) }),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id DESC LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({ last: 10 }),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2",
            "values": [
              "none",
              11,
            ],
          },
        },
      }
    `);
  });

  test('last 10 before', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({ last: 10, before: toOpaqueCursor(databaseAdapter, 'int', 456) }),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id DESC LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }),

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id LIMIT ?4",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { reverse: true },
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }),

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id < ?2 AND e.id > ?3 ORDER BY e.id DESC LIMIT ?4",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        undefined,
        resolvePaging({
          last: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }),

        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id DESC LIMIT ?4",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { order: PublishedQueryOrder.createdAt, reverse: true },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query no entity type, i.e. include all', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { entityTypes: [] },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query one entity type', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { entityTypes: ['QueryGeneratorFoo'] },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2) ORDER BY e.id LIMIT ?3",
            "values": [
              "none",
              "QueryGeneratorFoo",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query two entity types', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) ORDER BY e.id LIMIT ?4",
            "values": [
              "none",
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query two entity types, first and after', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        resolvePaging({ first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 543) }),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id > ?4 ORDER BY e.id LIMIT ?5",
            "values": [
              "none",
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
              543,
              11,
            ],
          },
        },
      }
    `);
  });

  test('query linksFrom', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { linksFrom: { id: '37b48706-803e-4227-a51e-8208db12d949' } },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev, entities e_from, entity_published_references er_from WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e_from.uuid = ?2 AND e_from.id = er_from.from_entities_id AND er_from.to_entities_id = e.id ORDER BY e.id LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' } },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev, entity_published_references er_to, entities e_to WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?2 ORDER BY e.id LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
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

        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev, entity_published_locations el WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND el.lng >= ?4 AND el.lng <= ?5 ORDER BY e.id LIMIT ?6",
            "values": [
              "none",
              55.07,
              56.79,
              11.62,
              16.25,
              26,
            ],
          },
        },
      }
    `);
  });

  test('query bounding box (wrapping 180/-180 lng boundary)', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { boundingBox: { minLat: 55.07, maxLat: 56.79, minLng: 179, maxLng: -179 } },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev, entity_published_locations el WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND (el.lng <= ?4 OR el.lng >= ?5) ORDER BY e.id LIMIT ?6",
            "values": [
              "none",
              55.07,
              56.79,
              179,
              -179,
              26,
            ],
          },
        },
      }
    `);
  });

  test('query text', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { text: 'foo bar' },
        resolvePaging({}),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev, entities_published_fts fts WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND fts.content match ?2 AND fts.docid = e.id ORDER BY e.id LIMIT ?3",
            "values": [
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        {
          entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
          linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
        },

        resolvePaging({ first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 123) }),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev, entity_published_references er_to, entities e_to WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?4 AND e.id > ?5 ORDER BY e.id LIMIT ?6",
            "values": [
              "none",
              "QueryGeneratorFoo",
              "QueryGeneratorBar",
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
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { order: PublishedQueryOrder.createdAt },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('order by name', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        schema,
        { order: PublishedQueryOrder.name },
        resolvePaging(undefined),
        authKeysNone
      )
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.name LIMIT ?2",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('Error: invalid entity type in query', () => {
    const databaseAdapter = createMockDatabase();
    const result = searchPublishedEntitiesQuery(
      databaseAdapter,
      schema,
      { entityTypes: ['Invalid'] },
      resolvePaging(undefined),
      authKeysNone
    );
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find entity type in query: Invalid');
  });
});

describe('sampleAdminEntitiesQuery()', () => {
  test('no query', () => {
    expect(sampleAdminEntitiesQuery(schema, undefined, 5, 10, authKeysNone)).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.uuid LIMIT ?2 OFFSET ?3",
          "values": [
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
        "value": {
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2) ORDER BY e.uuid LIMIT ?3 OFFSET ?4",
          "values": [
            "none",
            "QueryGeneratorFoo",
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
          "value": {
            "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.uuid LIMIT ?2 OFFSET ?3",
            "values": [
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
        "value": {
          "text": "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.type IN (?2) ORDER BY e.uuid LIMIT ?3 OFFSET ?4",
          "values": [
            "none",
            "QueryGeneratorFoo",
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
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1",
          "values": [
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
          "value": {
            "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1",
            "values": [
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
          "value": {
            "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND e.type IN (?2)",
            "values": [
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
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND e.type IN (?2, ?3)",
          "values": [
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
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1",
          "values": [
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
          "value": {
            "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
            "values": [
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
          "value": {
            "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
            "values": [
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
          "value": {
            "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
            "values": [
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
          "value": {
            "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
            "values": [
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
          "value": {
            "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
            "values": [
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
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_latest_references er_from, entities e_from WHERE e.resolved_auth_key = ?1 AND e_from.uuid = ?2 AND e_from.id = er_from.from_entities_id AND er_from.to_entities_id = e.id",
          "values": [
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
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_latest_references er_to, entities e_to WHERE e.resolved_auth_key = ?1 AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?2",
          "values": [
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
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_latest_references er_to, entities e_to WHERE e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?4",
          "values": [
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
        "value": {
          "text": "SELECT COUNT(DISTINCT e.id) AS count FROM entities e, entity_latest_locations el WHERE e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND el.lng >= ?4 AND el.lng <= ?5",
          "values": [
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

  test('query bounding box (wrapping 180/-180 lng)', () => {
    expect(
      totalAdminEntitiesQuery(schema, authKeysNone, {
        boundingBox: {
          minLat: 55.07,
          maxLat: 56.79,
          minLng: 179.11,
          maxLng: -179.88,
        },
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(DISTINCT e.id) AS count FROM entities e, entity_latest_locations el WHERE e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND (el.lng <= ?4 OR el.lng >= ?5)",
          "values": [
            "none",
            55.07,
            56.79,
            179.11,
            -179.88,
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
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entities_latest_fts fts WHERE e.resolved_auth_key = ?1 AND fts.content match ?2 AND fts.docid = e.id",
          "values": [
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
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1",
          "values": [
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
          "value": {
            "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1",
            "values": [
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
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2)",
          "values": [
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
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3)",
          "values": [
            "none",
            "QueryGeneratorFoo",
            "QueryGeneratorBar",
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
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_published_references er_from, entities e_from WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e_from.uuid = ?2 AND e_from.id = er_from.from_entities_id AND er_from.to_entities_id = e.id",
          "values": [
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
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_published_references er_to, entities e_to WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?2",
          "values": [
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
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_published_references er_to, entities e_to WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?4",
          "values": [
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
        boundingBox: { minLat: 55.07, maxLat: 56.79, minLng: 11.62, maxLng: 16.25 },
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(DISTINCT e.id) AS count FROM entities e, entity_published_locations el WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND el.lng >= ?4 AND el.lng <= ?5",
          "values": [
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

  test('query bounding box (wrapping the 180/-180 lng boundary)', () => {
    expect(
      totalPublishedEntitiesQuery(schema, authKeysNone, {
        boundingBox: { minLat: 55.07, maxLat: 56.79, minLng: 179, maxLng: -179 },
      })
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(DISTINCT e.id) AS count FROM entities e, entity_published_locations el WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND (el.lng <= ?4 OR el.lng >= ?5)",
          "values": [
            "none",
            55.07,
            56.79,
            179,
            -179,
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
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entities_published_fts fts WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND fts.content match ?2 AND fts.docid = e.id",
          "values": [
            "none",
            "foo bar",
          ],
        },
      }
    `);
  });
});
