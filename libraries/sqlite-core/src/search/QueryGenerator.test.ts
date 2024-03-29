import {
  AdminEntityQueryOrder,
  AdminEntityStatus,
  AdminSchema,
  ErrorType,
  PublishedEntityQueryOrder,
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
  componentTypes: [
    { name: 'QueryGeneratorValueOne', fields: [] },
    { name: 'QueryGeneratorValueTwo', fields: [] },
  ],
}).valueOrThrow();

const publishedSchema = adminSchema.toPublishedSchema();

const authKeysDefault = [{ authKey: '', resolvedAuthKey: '' }];

describe('searchAdminEntitiesQuery()', () => {
  test('default paging', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        adminSchema,
        undefined,
        resolvePaging(undefined),
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.id > ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.id >= ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id DESC LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.id <= ?2 ORDER BY e.id DESC LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id DESC LIMIT ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        { order: AdminEntityQueryOrder.createdAt, reverse: true },
        resolvePaging(undefined),
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.type IN (?2) ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id > ?4 ORDER BY e.id LIMIT ?5)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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

  test('query no component types, i.e. include all', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        adminSchema,
        { componentTypes: [] },
        resolvePaging(undefined),
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query one component type', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        adminSchema,
        { componentTypes: ['QueryGeneratorValueOne'] },
        resolvePaging(undefined),
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entity_latest_value_types evt WHERE e.resolved_auth_key = ?1 AND evt.value_type IN (?2) AND evt.entities_id = e.id ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
              "QueryGeneratorValueOne",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query two component types', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchAdminEntitiesQuery(
        databaseAdapter,
        adminSchema,
        { componentTypes: ['QueryGeneratorValueOne', 'QueryGeneratorValueTwo'] },
        resolvePaging(undefined),
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entity_latest_value_types evt WHERE e.resolved_auth_key = ?1 AND evt.value_type IN (?2, ?3) AND evt.entities_id = e.id ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status IN (?2, ?3) ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status IN (?2, ?3) ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND status IN (?2, ?3, ?4, ?5, ?6) ORDER BY e.id LIMIT ?7)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.invalid = 0 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.invalid != 0 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entities e_from, entity_latest_references er_from WHERE e.resolved_auth_key = ?1 AND e_from.uuid = ?2 AND e_from.id = er_from.from_entities_id AND er_from.to_entities_id = e.id ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entity_latest_references er_to, entities e_to WHERE e.resolved_auth_key = ?1 AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entity_latest_locations el WHERE e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND el.lng >= ?4 AND el.lng <= ?5 ORDER BY e.id LIMIT ?6)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT DISTINCT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entity_latest_locations el WHERE e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND (el.lng <= ?4 OR el.lng >= ?5) ORDER BY e.id LIMIT ?6)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entities_latest_fts fts WHERE e.resolved_auth_key = ?1 AND fts.content match ?2 AND fts.rowid = e.id ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entity_latest_references er_to, entities e_to WHERE e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?4 AND e.id > ?5 ORDER BY e.id LIMIT ?6)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        { order: AdminEntityQueryOrder.createdAt },
        resolvePaging(undefined),
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        { order: AdminEntityQueryOrder.updatedAt },
        resolvePaging(undefined),
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.updated_seq LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        { order: AdminEntityQueryOrder.name },
        resolvePaging(undefined),
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.name LIMIT ?2)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
      authKeysDefault,
    );
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find entity type in query: Invalid');
  });

  test('Error: invalid component type in query', () => {
    const databaseAdapter = createMockDatabase();
    const result = searchAdminEntitiesQuery(
      databaseAdapter,
      adminSchema,
      { componentTypes: ['Invalid'] },
      resolvePaging(undefined),
      authKeysDefault,
    );
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find component type in query: Invalid');
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id > ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id DESC LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id DESC LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id < ?2 AND e.id > ?3 ORDER BY e.id DESC LIMIT ?4)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id > ?2 AND e.id < ?3 ORDER BY e.id DESC LIMIT ?4)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        { order: PublishedEntityQueryOrder.createdAt, reverse: true },
        resolvePaging(undefined),
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id DESC LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2) ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id > ?4 ORDER BY e.id LIMIT ?5)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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

  test('query no component type, i.e. include all', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        publishedSchema,
        { componentTypes: [] },
        resolvePaging(undefined),
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query one component type', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        publishedSchema,
        { componentTypes: ['QueryGeneratorValueOne'] },
        resolvePaging(undefined),
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entity_published_value_types evt WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND evt.value_type IN (?2) AND evt.entities_id = e.id ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
              "QueryGeneratorValueOne",
              26,
            ],
          },
        },
      }
    `);
  });

  test('query two component types', () => {
    const databaseAdapter = createMockDatabase();
    expect(
      searchPublishedEntitiesQuery(
        databaseAdapter,
        publishedSchema,
        { componentTypes: ['QueryGeneratorValueOne', 'QueryGeneratorValueTwo'] },
        resolvePaging(undefined),
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entity_published_value_types evt WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND evt.value_type IN (?2, ?3) AND evt.entities_id = e.id ORDER BY e.id LIMIT ?4)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entities e_from, entity_published_references er_from WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e_from.uuid = ?2 AND e_from.id = er_from.from_entities_id AND er_from.to_entities_id = e.id ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entity_published_references er_to, entities e_to WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT DISTINCT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entity_published_locations el WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND el.lng >= ?4 AND el.lng <= ?5 ORDER BY e.id LIMIT ?6)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT DISTINCT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entity_published_locations el WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND (el.lng <= ?4 OR el.lng >= ?5) ORDER BY e.id LIMIT ?6)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entities_published_fts fts WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND fts.content match ?2 AND fts.rowid = e.id ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entity_published_references er_to, entities e_to WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?4 AND e.id > ?5 ORDER BY e.id LIMIT ?6)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        { order: PublishedEntityQueryOrder.createdAt },
        resolvePaging(undefined),
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        { order: PublishedEntityQueryOrder.name },
        resolvePaging(undefined),
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "cursorExtractor": [Function],
          "sqlQuery": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.published_name LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
      authKeysDefault,
    );
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find entity type in query: Invalid');
  });

  test('Error: invalid component type in query', () => {
    const databaseAdapter = createMockDatabase();
    const result = searchPublishedEntitiesQuery(
      databaseAdapter,
      publishedSchema,
      { componentTypes: ['Invalid'] },
      resolvePaging(undefined),
      authKeysDefault,
    );
    expectErrorResult(result, ErrorType.BadRequest, 'Can’t find component type in query: Invalid');
  });
});

describe('sampleAdminEntitiesQuery()', () => {
  test('no query', () => {
    expect(sampleAdminEntitiesQuery(adminSchema, undefined, 5, 10, authKeysDefault))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.uuid LIMIT ?2 OFFSET ?3)
        SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.type IN (?2) ORDER BY e.uuid LIMIT ?3 OFFSET ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
          "values": [
            "",
            "QueryGeneratorFoo",
            10,
            5,
          ],
        },
      }
    `);
  });

  test('componentTypes', () => {
    expect(
      sampleAdminEntitiesQuery(
        adminSchema,
        { componentTypes: ['QueryGeneratorValueOne'] },
        5,
        10,
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.invalid, e.latest_entity_versions_id FROM entities e, entity_latest_value_types evt WHERE e.resolved_auth_key = ?1 AND evt.value_type IN (?2) AND evt.entities_id = e.id ORDER BY e.uuid LIMIT ?3 OFFSET ?4)
      SELECT e.*, ev.version, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
          "values": [
            "",
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
    expect(samplePublishedEntitiesQuery(publishedSchema, undefined, 5, 10, authKeysDefault))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": {
            "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.uuid LIMIT ?2 OFFSET ?3)
        SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
            "values": [
              "",
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
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2) ORDER BY e.uuid LIMIT ?3 OFFSET ?4)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
          "values": [
            "",
            "QueryGeneratorFoo",
            10,
            5,
          ],
        },
      }
    `);
  });

  test('componentTypes', () => {
    expect(
      samplePublishedEntitiesQuery(
        publishedSchema,
        { componentTypes: ['QueryGeneratorValueOne'] },
        5,
        10,
        authKeysDefault,
      ),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e, entity_published_value_types evt WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND evt.value_type IN (?2) AND evt.entities_id = e.id ORDER BY e.uuid LIMIT ?3 OFFSET ?4)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
          "values": [
            "",
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
    expect(totalAdminEntitiesQuery(adminSchema, authKeysDefault, undefined)).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1",
          "values": [
            "",
          ],
        },
      }
    `);
  });

  test('no entity type => all', () => {
    expect(totalAdminEntitiesQuery(adminSchema, authKeysDefault, { entityTypes: [] }))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": {
            "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1",
            "values": [
              "",
            ],
          },
        }
      `);
  });

  test('one entity type', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, { entityTypes: ['QueryGeneratorFoo'] }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND e.type IN (?2)",
          "values": [
            "",
            "QueryGeneratorFoo",
          ],
        },
      }
    `);
  });

  test('two entity types', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND e.type IN (?2, ?3)",
          "values": [
            "",
            "QueryGeneratorFoo",
            "QueryGeneratorBar",
          ],
        },
      }
    `);
  });

  test('no component types => all', () => {
    expect(totalAdminEntitiesQuery(adminSchema, authKeysDefault, { componentTypes: [] }))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": {
            "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1",
            "values": [
              "",
            ],
          },
        }
      `);
  });

  test('one component type', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, {
        componentTypes: ['QueryGeneratorValueOne'],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_latest_value_types evt WHERE e.resolved_auth_key = ?1 AND evt.value_type IN (?2) AND evt.entities_id = e.id",
          "values": [
            "",
            "QueryGeneratorValueOne",
          ],
        },
      }
    `);
  });

  test('two component types', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, {
        componentTypes: ['QueryGeneratorValueOne', 'QueryGeneratorValueTwo'],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_latest_value_types evt WHERE e.resolved_auth_key = ?1 AND evt.value_type IN (?2, ?3) AND evt.entities_id = e.id",
          "values": [
            "",
            "QueryGeneratorValueOne",
            "QueryGeneratorValueTwo",
          ],
        },
      }
    `);
  });

  test('query status empty list', () => {
    expect(totalAdminEntitiesQuery(adminSchema, authKeysDefault, { status: [] }))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": {
            "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1",
            "values": [
              "",
            ],
          },
        }
      `);
  });

  test('query status draft', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, { status: [AdminEntityStatus.draft] }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
          "values": [
            "",
            "draft",
          ],
        },
      }
    `);
  });

  test('query status published', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, {
        status: [AdminEntityStatus.published],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
          "values": [
            "",
            "published",
          ],
        },
      }
    `);
  });

  test('query status modified', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, {
        status: [AdminEntityStatus.modified],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
          "values": [
            "",
            "modified",
          ],
        },
      }
    `);
  });

  test('query status withdrawn', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, {
        status: [AdminEntityStatus.withdrawn],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
          "values": [
            "",
            "withdrawn",
          ],
        },
      }
    `);
  });

  test('query status archived', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, {
        status: [AdminEntityStatus.archived],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.resolved_auth_key = ?1 AND status = ?2",
          "values": [
            "",
            "archived",
          ],
        },
      }
    `);
  });

  test('query linksFrom', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, {
        linksFrom: { id: '37b48706-803e-4227-a51e-8208db12d949' },
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_latest_references er_from, entities e_from WHERE e.resolved_auth_key = ?1 AND e_from.uuid = ?2 AND e_from.id = er_from.from_entities_id AND er_from.to_entities_id = e.id",
          "values": [
            "",
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query linksTo', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, {
        linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_latest_references er_to, entities e_to WHERE e.resolved_auth_key = ?1 AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?2",
          "values": [
            "",
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query linksTo and entity types and paging', () => {
    expect(
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
        linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_latest_references er_to, entities e_to WHERE e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?4",
          "values": [
            "",
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
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, {
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
            "",
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
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, {
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
            "",
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
      totalAdminEntitiesQuery(adminSchema, authKeysDefault, {
        text: 'foo bar',
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entities_latest_fts fts WHERE e.resolved_auth_key = ?1 AND fts.content match ?2 AND fts.rowid = e.id",
          "values": [
            "",
            "foo bar",
          ],
        },
      }
    `);
  });
});

describe('totalPublishedEntitiesQuery()', () => {
  test('no query', () => {
    expect(totalPublishedEntitiesQuery(publishedSchema, authKeysDefault, undefined))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": {
            "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1",
            "values": [
              "",
            ],
          },
        }
      `);
  });

  test('no entity type => all', () => {
    expect(totalPublishedEntitiesQuery(publishedSchema, authKeysDefault, { entityTypes: [] }))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": {
            "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1",
            "values": [
              "",
            ],
          },
        }
      `);
  });

  test('one entity type', () => {
    expect(
      totalPublishedEntitiesQuery(publishedSchema, authKeysDefault, {
        entityTypes: ['QueryGeneratorFoo'],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2)",
          "values": [
            "",
            "QueryGeneratorFoo",
          ],
        },
      }
    `);
  });

  test('two entity types', () => {
    expect(
      totalPublishedEntitiesQuery(publishedSchema, authKeysDefault, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3)",
          "values": [
            "",
            "QueryGeneratorFoo",
            "QueryGeneratorBar",
          ],
        },
      }
    `);
  });

  test('no component types => all', () => {
    expect(totalPublishedEntitiesQuery(publishedSchema, authKeysDefault, { componentTypes: [] }))
      .toMatchInlineSnapshot(`
        OkResult {
          "value": {
            "text": "SELECT COUNT(e.id) AS count FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1",
            "values": [
              "",
            ],
          },
        }
      `);
  });

  test('one component type', () => {
    expect(
      totalPublishedEntitiesQuery(publishedSchema, authKeysDefault, {
        componentTypes: ['QueryGeneratorValueOne'],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_published_value_types evt WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND evt.value_type IN (?2) AND evt.entities_id = e.id",
          "values": [
            "",
            "QueryGeneratorValueOne",
          ],
        },
      }
    `);
  });

  test('two component types', () => {
    expect(
      totalPublishedEntitiesQuery(publishedSchema, authKeysDefault, {
        componentTypes: ['QueryGeneratorValueOne', 'QueryGeneratorValueTwo'],
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_published_value_types evt WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND evt.value_type IN (?2, ?3) AND evt.entities_id = e.id",
          "values": [
            "",
            "QueryGeneratorValueOne",
            "QueryGeneratorValueTwo",
          ],
        },
      }
    `);
  });

  test('query linksFrom', () => {
    expect(
      totalPublishedEntitiesQuery(publishedSchema, authKeysDefault, {
        linksFrom: { id: '37b48706-803e-4227-a51e-8208db12d949' },
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_published_references er_from, entities e_from WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e_from.uuid = ?2 AND e_from.id = er_from.from_entities_id AND er_from.to_entities_id = e.id",
          "values": [
            "",
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query linksTo', () => {
    expect(
      totalPublishedEntitiesQuery(publishedSchema, authKeysDefault, {
        linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_published_references er_to, entities e_to WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?2",
          "values": [
            "",
            "37b48706-803e-4227-a51e-8208db12d949",
          ],
        },
      }
    `);
  });

  test('query linksTo and entity types and paging', () => {
    expect(
      totalPublishedEntitiesQuery(publishedSchema, authKeysDefault, {
        entityTypes: ['QueryGeneratorFoo', 'QueryGeneratorBar'],
        linksTo: { id: '37b48706-803e-4227-a51e-8208db12d949' },
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entity_published_references er_to, entities e_to WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.type IN (?2, ?3) AND e.id = er_to.from_entities_id AND er_to.to_entities_id = e_to.id AND e_to.uuid = ?4",
          "values": [
            "",
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
      totalPublishedEntitiesQuery(publishedSchema, authKeysDefault, {
        boundingBox: { minLat: 55.07, maxLat: 56.79, minLng: 11.62, maxLng: 16.25 },
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(DISTINCT e.id) AS count FROM entities e, entity_published_locations el WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND el.lng >= ?4 AND el.lng <= ?5",
          "values": [
            "",
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
      totalPublishedEntitiesQuery(publishedSchema, authKeysDefault, {
        boundingBox: { minLat: 55.07, maxLat: 56.79, minLng: 179, maxLng: -179 },
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(DISTINCT e.id) AS count FROM entities e, entity_published_locations el WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id = el.entities_id AND el.lat >= ?2 AND el.lat <= ?3 AND (el.lng <= ?4 OR el.lng >= ?5)",
          "values": [
            "",
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
      totalPublishedEntitiesQuery(publishedSchema, authKeysDefault, {
        text: 'foo bar',
      }),
    ).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "text": "SELECT COUNT(e.id) AS count FROM entities e, entities_published_fts fts WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND fts.content match ?2 AND fts.rowid = e.id",
          "values": [
            "",
            "foo bar",
          ],
        },
      }
    `);
  });
});
