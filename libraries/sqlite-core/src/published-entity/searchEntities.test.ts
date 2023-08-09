import { expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import type { SearchPublishedEntitiesItem } from '../search/QueryGenerator.js';
import {
  createMockContext,
  createMockInnerAndOuterAdapter,
  createTestAdminSchema,
  getRunAndQueryCalls,
  resolvePaging,
} from '../test/TestUtils.js';

function createEntityDbRow(id: number): SearchPublishedEntitiesItem {
  return {
    id,
    uuid: `uuid-${id}`,
    type: 'TitleOnly',
    name: `Title#${id}`,
    auth_key: 'none',
    created_at: '2021-08-17T07:51:25.56Z',
    invalid: 0,
    schema_version: 1,
    encode_version: 1,
    fields: JSON.stringify({ title: 'Title' }),
  };
}

describe('publishedEntitySearchEntities', () => {
  test('Minimal, no results', async () => {
    const { innerAdapter, outerAdapter } = (await createMockInnerAndOuterAdapter()).valueOrThrow();
    const context = createMockContext(outerAdapter);

    innerAdapter.clearAllQueries();
    const result = await outerAdapter.publishedEntitySearchEntities(
      createTestAdminSchema().toPublishedSchema(),
      context,
      undefined,
      resolvePaging(undefined),
      [{ authKey: 'none', resolvedAuthKey: 'none' }],
    );
    expectResultValue(result, { entities: [], hasMore: false });
    expect(getRunAndQueryCalls(innerAdapter)).toMatchInlineSnapshot(`
      [
        [
          "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
          "none",
          26,
        ],
      ]
    `);
  });

  test('Minimal, one result', async () => {
    const { innerAdapter, outerAdapter } = (await createMockInnerAndOuterAdapter()).valueOrThrow();
    const context = createMockContext(outerAdapter);

    innerAdapter.clearAllQueries();
    innerAdapter.mockQuery = (_query, _values) => [createEntityDbRow(1)];
    const result = await outerAdapter.publishedEntitySearchEntities(
      createTestAdminSchema().toPublishedSchema(),
      context,
      undefined,
      resolvePaging(undefined),
      [{ authKey: 'none', resolvedAuthKey: 'none' }],
    );
    expect(result).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "entities": [
            {
              "authKey": "none",
              "createdAt": 2021-08-17T07:51:25.560Z,
              "cursor": "MQ==",
              "entityFields": {
                "encodeVersion": 1,
                "fields": {
                  "title": "Title",
                },
                "schemaVersion": 1,
              },
              "id": "uuid-1",
              "name": "Title#1",
              "type": "TitleOnly",
              "validPublished": true,
            },
          ],
          "hasMore": false,
        },
      }
    `);
    expect(getRunAndQueryCalls(innerAdapter)).toMatchInlineSnapshot(`
      [
        [
          "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
          "none",
          26,
        ],
      ]
    `);
  });

  test('Paging after, one result', async () => {
    const { innerAdapter, outerAdapter } = (await createMockInnerAndOuterAdapter()).valueOrThrow();
    const context = createMockContext(outerAdapter);

    innerAdapter.clearAllQueries();
    innerAdapter.mockQuery = (_query, _values) => [createEntityDbRow(2)];
    const result = await outerAdapter.publishedEntitySearchEntities(
      createTestAdminSchema().toPublishedSchema(),
      context,
      undefined,
      resolvePaging({ after: 'MQ==', first: 10 }),
      [{ authKey: 'none', resolvedAuthKey: 'none' }],
    );
    expect(result).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "entities": [
            {
              "authKey": "none",
              "createdAt": 2021-08-17T07:51:25.560Z,
              "cursor": "Mg==",
              "entityFields": {
                "encodeVersion": 1,
                "fields": {
                  "title": "Title",
                },
                "schemaVersion": 1,
              },
              "id": "uuid-2",
              "name": "Title#2",
              "type": "TitleOnly",
              "validPublished": true,
            },
          ],
          "hasMore": false,
        },
      }
    `);
    expect(getRunAndQueryCalls(innerAdapter)).toMatchInlineSnapshot(`
      [
        [
          "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id > ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
          "none",
          1,
          11,
        ],
      ]
    `);
  });

  test('Paging before, one result', async () => {
    const { innerAdapter, outerAdapter } = (await createMockInnerAndOuterAdapter()).valueOrThrow();
    const context = createMockContext(outerAdapter);

    innerAdapter.clearAllQueries();
    innerAdapter.mockQuery = (_query, _values) => [createEntityDbRow(2)];
    const result = await outerAdapter.publishedEntitySearchEntities(
      createTestAdminSchema().toPublishedSchema(),
      context,
      undefined,
      resolvePaging({ before: 'MQ==', first: 10 }),
      [{ authKey: 'none', resolvedAuthKey: 'none' }],
    );
    expect(result).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "entities": [
            {
              "authKey": "none",
              "createdAt": 2021-08-17T07:51:25.560Z,
              "cursor": "Mg==",
              "entityFields": {
                "encodeVersion": 1,
                "fields": {
                  "title": "Title",
                },
                "schemaVersion": 1,
              },
              "id": "uuid-2",
              "name": "Title#2",
              "type": "TitleOnly",
              "validPublished": true,
            },
          ],
          "hasMore": false,
        },
      }
    `);
    expect(getRunAndQueryCalls(innerAdapter)).toMatchInlineSnapshot(`
      [
        [
          "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.published_entity_versions_id, e.invalid FROM entities e WHERE e.published_entity_versions_id IS NOT NULL AND e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.schema_version, ev.encode_version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.published_entity_versions_id = ev.id",
          "none",
          1,
          11,
        ],
      ]
    `);
  });
});
