import {
  AdminEntityStatus,
  AdminQueryOrder,
  AdminSchema,
  ErrorType,
  PublishedQueryOrder,
} from '@dossierhq/core';
import { expectErrorResult } from '@dossierhq/core-vitest';
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

const adminSchema = AdminSchema.createAndValidate({
  entityTypes: [
    { name: 'QueryGeneratorFoo', fields: [] },
    { name: 'QueryGeneratorBar', fields: [] },
  ],
  valueTypes: [
    { name: 'QueryGeneratorValueOne', fields: [] },
    { name: 'QueryGeneratorValueTwo', fields: [] },
  ],
}).valueOrThrow();

const publishedSchema = adminSchema.toPublishedSchema();

const authKeysNone = [{ authKey: 'none', resolvedAuthKey: 'none' }];

describe('searchAdminEntitiesQuery()', () => {
  test('default paging', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        adminSchema,
        undefined,
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        undefined,
        resolvePaging({ first: 10 }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        undefined,
        resolvePaging({ first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 999) }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.id > ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        undefined,
        resolvePaging(
          { first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 999) },
          { afterInclusive: true },
        ),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.id >= ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        undefined,
        resolvePaging({ last: 10 }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        undefined,
        resolvePaging({ last: 10, before: toOpaqueCursor(databaseAdapter, 'int', 456) }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id DESC LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        undefined,
        resolvePaging(
          { last: 10, before: toOpaqueCursor(databaseAdapter, 'int', 456) },
          { beforeInclusive: true },
        ),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.id <= ?2 ORDER BY e.id DESC LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        undefined,
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        undefined,
        resolvePaging({
          last: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id DESC LIMIT ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { order: AdminQueryOrder.createdAt, reverse: true },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { entityTypes: [] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { entityTypes: ['QueryGeneratorFoo'] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.type IN (?2) ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        resolvePaging({ first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 543) }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id > ?4 ORDER BY e.id LIMIT ?5)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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

  test('query no value types, i.e. include all', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        adminSchema,
        { valueTypes: [] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query one value type', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        adminSchema,
        { valueTypes: ['QueryGeneratorValueOne'] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entity_latest_value_types evt WHERE e.resolved_auth_key = ?1 AND evt.value_type IN (?2) AND evt.entities_id = e.id ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "none",
              "QueryGeneratorValueOne",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query two value types', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        adminSchema,
        { valueTypes: ['QueryGeneratorValueOne', 'QueryGeneratorValueTwo'] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entity_latest_value_types evt WHERE e.resolved_auth_key = ?1 AND evt.value_type IN (?2, ?3) AND evt.entities_id = e.id ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "none",
              "QueryGeneratorValueOne",
              "QueryGeneratorValueTwo",
              26,
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
        adminSchema,
        { status: [] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { status: [AdminEntityStatus.draft] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { status: [AdminEntityStatus.published] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { status: [AdminEntityStatus.modified] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { status: [AdminEntityStatus.withdrawn] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { status: [AdminEntityStatus.archived] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { status: [AdminEntityStatus.draft, AdminEntityStatus.published] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status IN (?2, ?3) ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { status: [AdminEntityStatus.draft, AdminEntityStatus.archived] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status IN (?2, ?3) ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
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
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status IN (?2, ?3, ?4, ?5, ?6) ORDER BY e.id LIMIT ?7)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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

  test('query valid only', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        adminSchema,
        { valid: true },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.invalid = 0 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query invalid only', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        adminSchema,
        { valid: false },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.invalid != 0 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "none",
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
        adminSchema,
        { linksFrom: { id: '37b48706-803e-4227-a51e-8208db12d949' } },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entities e_from, entity_latest_references er_from WHERE e.resolved_auth_key = ?1 AND e_from.uuid = ?2 AND e_from.id = er_from.from_entities_id AND er_from.to_entities_id = e.id ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' } },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entity_latest_references er_to, entities e_to WHERE e.resolved_auth_key = ?1 AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        {
          boundingBox: {
            minLat: 55.07,
            maxLat: 56.79,
            minLng: 11.62,
            maxLng: 16.25,
          },
        },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entity_latest_locations el WHERE e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND el.lng >= ?4 AND el.lng <= ?5 ORDER BY e.id LIMIT ?6)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { boundingBox: { minLat: 55.07, maxLat: 56.79, minLng: 179, maxLng: -179 } },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entity_latest_locations el WHERE e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND (el.lng <= ?4 OR el.lng >= ?5) ORDER BY e.id LIMIT ?6)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { text: 'foo bar' },
        resolvePaging({}),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entities_latest_fts fts WHERE e.resolved_auth_key = ?1 AND fts.content match ?2 AND fts.rowid = e.id ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        {
          entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
          linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
        },
        resolvePaging({ first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 123) }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entity_latest_references er_to, entities e_to WHERE e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?4 AND e.id > ?5 ORDER BY e.id LIMIT ?6)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { order: AdminQueryOrder.createdAt },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { order: AdminQueryOrder.updatedAt },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.updated_seq LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
        adminSchema,
        { order: AdminQueryOrder.name },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.name LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
      adminSchema,
      { entityTypes: ['Invalid'] },
      resolvePaging(undefined),
      authKeysNone,
    );
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find entity type in query: Invalid');
  });

  test('Error: invalid value type in query', () => {
    const databaseAdapter = createMockDatabase();
    const result = searchAdminEntitiesQuery(
      databaseAdapter,
      adminSchema,
      { valueTypes: ['Invalid'] },
      resolvePaging(undefined),
      authKeysNone,
    );
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find value type in query: Invalid');
  });
});

describe('searchPublishedEntitiesQuery()', () => {
  test('default paging', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        publishedSchema,
        undefined,
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        undefined,
        resolvePaging({ first: 10 }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        undefined,
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 999),
        }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id > ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        { reverse: true },
        resolvePaging({ first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 999) }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id DESC LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        undefined,
        resolvePaging({ last: 10 }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        undefined,
        resolvePaging({ last: 10, before: toOpaqueCursor(databaseAdapter, 'int', 456) }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id DESC LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        undefined,
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        { reverse: true },
        resolvePaging({
          first: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id < ?2 AND e.id > ?3 ORDER BY e.id DESC LIMIT ?4)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        undefined,
        resolvePaging({
          last: 10,
          after: toOpaqueCursor(databaseAdapter, 'int', 123),
          before: toOpaqueCursor(databaseAdapter, 'int', 456),
        }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id DESC LIMIT ?4)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        { order: PublishedQueryOrder.createdAt, reverse: true },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        { entityTypes: [] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        { entityTypes: ['QueryGeneratorFoo'] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2) ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        { entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'] },
        resolvePaging({ first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 543) }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id > ?4 ORDER BY e.id LIMIT ?5)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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

  test('query no value type, i.e. include all', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        publishedSchema,
        { valueTypes: [] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "none",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query one value type', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        publishedSchema,
        { valueTypes: ['QueryGeneratorValueOne'] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entity_published_value_types evt WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND evt.value_type IN (?2) AND evt.entities_id = e.id ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "none",
              "QueryGeneratorValueOne",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query two value types', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        publishedSchema,
        { valueTypes: ['QueryGeneratorValueOne', 'QueryGeneratorValueTwo'] },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entity_published_value_types evt WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND evt.value_type IN (?2, ?3) AND evt.entities_id = e.id ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "none",
              "QueryGeneratorValueOne",
              "QueryGeneratorValueTwo",
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
      searchPublishedEntitiesQuery(
        databaseAdapter,
        publishedSchema,
        { linksFrom: { id: '37b48706-803e-4227-a51e-8208db12d949' } },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entities e_from, entity_published_references er_from WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e_from.uuid = ?2 AND e_from.id = er_from.from_entities_id AND er_from.to_entities_id = e.id ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        { linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' } },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entity_published_references er_to, entities e_to WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        {
          boundingBox: {
            minLat: 55.07,
            maxLat: 56.79,
            minLng: 11.62,
            maxLng: 16.25,
          },
        },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entity_published_locations el WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND el.lng >= ?4 AND el.lng <= ?5 ORDER BY e.id LIMIT ?6)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        { boundingBox: { minLat: 55.07, maxLat: 56.79, minLng: 179, maxLng: -179 } },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entity_published_locations el WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND (el.lng <= ?4 OR el.lng >= ?5) ORDER BY e.id LIMIT ?6)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        { text: 'foo bar' },
        resolvePaging({}),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entities_published_fts fts WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND fts.content match ?2 AND fts.rowid = e.id ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        {
          entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
          linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
        },
        resolvePaging({ first: 10, after: toOpaqueCursor(databaseAdapter, 'int', 123) }),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entity_published_references er_to, entities e_to WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?4 AND e.id > ?5 ORDER BY e.id LIMIT ?6)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        { order: PublishedQueryOrder.createdAt },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
        publishedSchema,
        { order: PublishedQueryOrder.name },
        resolvePaging(undefined),
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.name LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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
      publishedSchema,
      { entityTypes: ['Invalid'] },
      resolvePaging(undefined),
      authKeysNone,
    );
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find entity type in query: Invalid');
  });

  test('Error: invalid value type in query', () => {
    const databaseAdapter = createMockDatabase();
    const result = searchPublishedEntitiesQuery(
      databaseAdapter,
      publishedSchema,
      { valueTypes: ['Invalid'] },
      resolvePaging(undefined),
      authKeysNone,
    );
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find value type in query: Invalid');
  });
});

describe('sampleAdminEntitiesQuery()', () => {
  test('no query', () => {
    expect(sampleAdminEntitiesQuery(adminSchema, undefined, 5, 10, authKeysNone))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.uuid LIMIT ?2 OFFSET ?3)
        SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
      sampleAdminEntitiesQuery(
        adminSchema,
        { entityTypes: ['QueryGeneratorFoo'] },
        5,
        10,
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.type IN (?2) ORDER BY e.uuid LIMIT ?3 OFFSET ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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

  test('valueTypes', () => {
    expect(
      sampleAdminEntitiesQuery(
        adminSchema,
        { valueTypes: ['QueryGeneratorValueOne'] },
        5,
        10,
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entity_latest_value_types evt WHERE e.resolved_auth_key = ?1 AND evt.value_type IN (?2) AND evt.entities_id = e.id ORDER BY e.uuid LIMIT ?3 OFFSET ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
          "values": [
            "none",
            "QueryGeneratorValueOne",
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
    expect(samplePublishedEntitiesQuery(publishedSchema, undefined, 5, 10, authKeysNone))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.uuid LIMIT ?2 OFFSET ?3)
        SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "none",
              10,
              5,
            ],
          },
        }
      `);
  });

  test('entityTypes', () => {
    expect(
      samplePublishedEntitiesQuery(
        publishedSchema,
        { entityTypes: ['QueryGeneratorFoo'] },
        5,
        10,
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2) ORDER BY e.uuid LIMIT ?3 OFFSET ?4)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
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

  test('valueTypes', () => {
    expect(
      samplePublishedEntitiesQuery(
        publishedSchema,
        { valueTypes: ['QueryGeneratorValueOne'] },
        5,
        10,
        authKeysNone,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entity_published_value_types evt WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND evt.value_type IN (?2) AND evt.entities_id = e.id ORDER BY e.uuid LIMIT ?3 OFFSET ?4)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
          "values": [
            "none",
            "QueryGeneratorValueOne",
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
    expect(totalAdminEntitiesQuery(adminSchema, authKeysNone, undefined)).toMatchInlineSnapshot(`
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
    expect(totalAdminEntitiesQuery(adminSchema, authKeysNone, { entityTypes: [] }))
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
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysNone, { entityTypes: ['QueryGeneratorFoo'] }),
    ).toMatchInlineSnapshot(`
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
      totalAdminEntitiesQuery(adminSchema, authKeysNone, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
      }),
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

  test('no value types => all', () => {
    expect(totalAdminEntitiesQuery(adminSchema, authKeysNone, { valueTypes: [] }))
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

  test('one value type', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysNone, {
        valueTypes: ['QueryGeneratorValueOne'],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_latest_value_types evt WHERE e.resolved_auth_key = ?1 AND evt.value_type IN (?2) AND evt.entities_id = e.id",
          "values": [
            "none",
            "QueryGeneratorValueOne",
          ],
        },
      }
    `);
  });

  test('two value types', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysNone, {
        valueTypes: ['QueryGeneratorValueOne', 'QueryGeneratorValueTwo'],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_latest_value_types evt WHERE e.resolved_auth_key = ?1 AND evt.value_type IN (?2, ?3) AND evt.entities_id = e.id",
          "values": [
            "none",
            "QueryGeneratorValueOne",
            "QueryGeneratorValueTwo",
          ],
        },
      }
    `);
  });

  test('query status empty list', () => {
    expect(totalAdminEntitiesQuery(adminSchema, authKeysNone, { status: [] }))
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

  test('query status draft', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysNone, { status: [AdminEntityStatus.draft] }),
    ).toMatchInlineSnapshot(`
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
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysNone, { status: [AdminEntityStatus.published] }),
    ).toMatchInlineSnapshot(`
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
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysNone, { status: [AdminEntityStatus.modified] }),
    ).toMatchInlineSnapshot(`
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
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysNone, { status: [AdminEntityStatus.withdrawn] }),
    ).toMatchInlineSnapshot(`
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
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysNone, { status: [AdminEntityStatus.archived] }),
    ).toMatchInlineSnapshot(`
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
      totalAdminEntitiesQuery(adminSchema, authKeysNone, {
        linksFrom: { id: '37b48706-803e-4227-a51e-8208db12d949' },
      }),
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
      totalAdminEntitiesQuery(adminSchema, authKeysNone, {
        linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
      }),
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
      totalAdminEntitiesQuery(adminSchema, authKeysNone, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
        linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
      }),
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
      totalAdminEntitiesQuery(adminSchema, authKeysNone, {
        boundingBox: {
          minLat: 55.07,
          maxLat: 56.79,
          minLng: 11.62,
          maxLng: 16.25,
        },
      }),
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
      totalAdminEntitiesQuery(adminSchema, authKeysNone, {
        boundingBox: {
          minLat: 55.07,
          maxLat: 56.79,
          minLng: 179.11,
          maxLng: -179.88,
        },
      }),
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
      totalAdminEntitiesQuery(adminSchema, authKeysNone, {
        text: 'foo bar',
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entities_latest_fts fts WHERE e.resolved_auth_key = ?1 AND fts.content match ?2 AND fts.rowid = e.id",
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
    expect(totalPublishedEntitiesQuery(publishedSchema, authKeysNone, undefined))
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

  test('no entity type => all', () => {
    expect(totalPublishedEntitiesQuery(publishedSchema, authKeysNone, { entityTypes: [] }))
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
      totalPublishedEntitiesQuery(publishedSchema, authKeysNone, {
        entityTypes: ['QueryGeneratorFoo'],
      }),
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
      totalPublishedEntitiesQuery(publishedSchema, authKeysNone, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
      }),
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

  test('no value types => all', () => {
    expect(totalPublishedEntitiesQuery(publishedSchema, authKeysNone, { valueTypes: [] }))
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

  test('one value type', () => {
    expect(
      totalPublishedEntitiesQuery(publishedSchema, authKeysNone, {
        valueTypes: ['QueryGeneratorValueOne'],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_published_value_types evt WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND evt.value_type IN (?2) AND evt.entities_id = e.id",
          "values": [
            "none",
            "QueryGeneratorValueOne",
          ],
        },
      }
    `);
  });

  test('two value types', () => {
    expect(
      totalPublishedEntitiesQuery(publishedSchema, authKeysNone, {
        valueTypes: ['QueryGeneratorValueOne', 'QueryGeneratorValueTwo'],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_published_value_types evt WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND evt.value_type IN (?2, ?3) AND evt.entities_id = e.id",
          "values": [
            "none",
            "QueryGeneratorValueOne",
            "QueryGeneratorValueTwo",
          ],
        },
      }
    `);
  });

  test('query linksFrom', () => {
    expect(
      totalPublishedEntitiesQuery(publishedSchema, authKeysNone, {
        linksFrom: { id: '37b48706-803e-4227-a51e-8208db12d949' },
      }),
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
      totalPublishedEntitiesQuery(publishedSchema, authKeysNone, {
        linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
      }),
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
      totalPublishedEntitiesQuery(publishedSchema, authKeysNone, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
        linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
      }),
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
      totalPublishedEntitiesQuery(publishedSchema, authKeysNone, {
        boundingBox: { minLat: 55.07, maxLat: 56.79, minLng: 11.62, maxLng: 16.25 },
      }),
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
      totalPublishedEntitiesQuery(publishedSchema, authKeysNone, {
        boundingBox: { minLat: 55.07, maxLat: 56.79, minLng: 179, maxLng: -179 },
      }),
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
      totalPublishedEntitiesQuery(publishedSchema, authKeysNone, {
        text: 'foo bar',
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entities_published_fts fts WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND fts.content match ?2 AND fts.rowid = e.id",
          "values": [
            "none",
            "foo bar",
          ],
        },
      }
    `);
  });
});
