import { expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import type { SearchAdminEntitiesItem } from '../search/QueryGenerator.js';
import {
  createMockContext,
  createMockInnerAndOuterAdapter,
  createTestAdminSchema,
  getRunAndQueryCalls,
  resolvePaging,
} from '../test/TestUtils.js';

function createEntityDbRow(id: number): SearchAdminEntitiesItem {
  return {
    id,
    uuid: `uuid-${id}`,
    type: 'TitleOnly',
    name: `Title#${id}`,
    auth_key: 'none',
    created_at: '2021-08-17T07:51:25.56Z',
    updated_at: '2021-08-17T07:51:25.56Z',
    updated_seq: id,
    status: 'draft',
    valid: 1,
    version: 0,
    fields: JSON.stringify({ title: 'Title' }),
  };
}

describe('adminEntitySearchEntities', () => {
  test('Minimal, no results', async () => {
    const { innerAdapter, outerAdapter } = (await createMockInnerAndOuterAdapter()).valueOrThrow();
    const context = createMockContext(outerAdapter);

    innerAdapter.clearAllQueries();
    innerAdapter.mockQuery = (_query, _values) => [];
    const result = await outerAdapter.adminEntitySearchEntities(
      createTestAdminSchema(),
      context,
      undefined,
      resolvePaging(undefined),
      [{ authKey: 'none', resolvedAuthKey: 'none' }]
    );
    expectResultValue(result, { entities: [], hasMore: false });
    expect(getRunAndQueryCalls(innerAdapter)).toMatchInlineSnapshot(`
      [
        [
          "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.valid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
    const result = await outerAdapter.adminEntitySearchEntities(
      createTestAdminSchema(),
      context,
      undefined,
      resolvePaging(undefined),
      [{ authKey: 'none', resolvedAuthKey: 'none' }]
    );
    expect(result).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "entities": [
            {
              "authKey": "none",
              "createdAt": 2021-08-17T07:51:25.560Z,
              "cursor": "MQ==",
              "fieldValues": {
                "title": "Title",
              },
              "id": "uuid-1",
              "name": "Title#1",
              "status": "draft",
              "type": "TitleOnly",
              "updatedAt": 2021-08-17T07:51:25.560Z,
              "valid": true,
              "version": 0,
            },
          ],
          "hasMore": false,
        },
      }
    `);
    expect(getRunAndQueryCalls(innerAdapter)).toMatchInlineSnapshot(`
      [
        [
          "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.valid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2)
      SELECT e.*, ev.version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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
    const result = await outerAdapter.adminEntitySearchEntities(
      createTestAdminSchema(),
      context,
      undefined,
      resolvePaging({ after: 'MQ==', first: 10 }),
      [{ authKey: 'none', resolvedAuthKey: 'none' }]
    );
    expect(result).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "entities": [
            {
              "authKey": "none",
              "createdAt": 2021-08-17T07:51:25.560Z,
              "cursor": "Mg==",
              "fieldValues": {
                "title": "Title",
              },
              "id": "uuid-2",
              "name": "Title#2",
              "status": "draft",
              "type": "TitleOnly",
              "updatedAt": 2021-08-17T07:51:25.560Z,
              "valid": true,
              "version": 0,
            },
          ],
          "hasMore": false,
        },
      }
    `);
    expect(getRunAndQueryCalls(innerAdapter)).toMatchInlineSnapshot(`
      [
        [
          "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.valid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.id > ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
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

    const result = await outerAdapter.adminEntitySearchEntities(
      createTestAdminSchema(),
      context,
      undefined,
      resolvePaging({ before: 'MQ==', first: 10 }),
      [{ authKey: 'none', resolvedAuthKey: 'none' }]
    );
    expect(result).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "entities": [
            {
              "authKey": "none",
              "createdAt": 2021-08-17T07:51:25.560Z,
              "cursor": "Mg==",
              "fieldValues": {
                "title": "Title",
              },
              "id": "uuid-2",
              "name": "Title#2",
              "status": "draft",
              "type": "TitleOnly",
              "updatedAt": 2021-08-17T07:51:25.560Z,
              "valid": true,
              "version": 0,
            },
          ],
          "hasMore": false,
        },
      }
    `);
    expect(getRunAndQueryCalls(innerAdapter)).toMatchInlineSnapshot(`
      [
        [
          "WITH entities_cte AS (SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, e.valid, e.latest_entity_versions_id FROM entities e WHERE e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id LIMIT ?3)
      SELECT e.*, ev.version, ev.fields FROM entities_cte e JOIN entity_versions ev ON e.latest_entity_versions_id = ev.id",
          "none",
          1,
          11,
        ],
      ]
    `);
  });
});
