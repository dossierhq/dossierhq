import { expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import type { SearchAdminEntitiesItem } from '../search/QueryGenerator.js';
import {
  createMockAdapter,
  createMockContext,
  createTestAdminSchema,
  getQueryCalls,
  resolvePaging,
} from '../test/TestUtils.js';
import { adminEntitySearchEntities } from './searchEntities.js';

function createEntityDbRow(id: number): SearchAdminEntitiesItem {
  return {
    id,
    uuid: `uuid-${id}`,
    type: 'TitleOnly',
    name: `Title#${id}`,
    auth_key: 'none',
    created_at: new Date('2021-08-17T07:51:25.56Z'),
    updated_at: new Date('2021-08-17T07:51:25.56Z'),
    updated: id,
    status: 'draft',
    invalid: 0,
    version: 0,
    schema_version: 1,
    encode_version: 1,
    data: { title: 'Title' },
  };
}

describe('adminEntitySearchEntities', () => {
  test('Minimal, no results', async () => {
    const adapter = createMockAdapter();
    const context = createMockContext(adapter);
    adapter.query.mockImplementation((_transaction, _query, _values) =>
      Promise.resolve({ rows: [] }),
    );
    const result = await adminEntitySearchEntities(
      adapter,
      createTestAdminSchema(),
      context,
      undefined,
      resolvePaging(undefined),
      [{ authKey: 'none', resolvedAuthKey: 'none' }],
    );
    expectResultValue(result, { entities: [], hasMore: false });
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      [
        [
          "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, e.invalid, ev.version, ev.schema_version, ev.encode_version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
          "none",
          26,
        ],
      ]
    `);
  });

  test('Minimal, one result', async () => {
    const adapter = createMockAdapter();
    const context = createMockContext(adapter);
    adapter.query.mockImplementation((_transaction, _query, _values) =>
      Promise.resolve({
        rows: [createEntityDbRow(1)],
      }),
    );
    const result = await adminEntitySearchEntities(
      adapter,
      createTestAdminSchema(),
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
              "status": "draft",
              "type": "TitleOnly",
              "updatedAt": 2021-08-17T07:51:25.560Z,
              "valid": true,
              "validPublished": null,
              "version": 0,
            },
          ],
          "hasMore": false,
        },
      }
    `);
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      [
        [
          "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, e.invalid, ev.version, ev.schema_version, ev.encode_version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
          "none",
          26,
        ],
      ]
    `);
  });

  test('Paging after, one result', async () => {
    const adapter = createMockAdapter();
    const context = createMockContext(adapter);
    adapter.query.mockImplementation((_transaction, _query, _values) =>
      Promise.resolve({ rows: [createEntityDbRow(2)] }),
    );
    const result = await adminEntitySearchEntities(
      adapter,
      createTestAdminSchema(),
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
              "status": "draft",
              "type": "TitleOnly",
              "updatedAt": 2021-08-17T07:51:25.560Z,
              "valid": true,
              "validPublished": null,
              "version": 0,
            },
          ],
          "hasMore": false,
        },
      }
    `);
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      [
        [
          "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, e.invalid, ev.version, ev.schema_version, ev.encode_version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id > $2 ORDER BY e.id LIMIT $3",
          "none",
          1,
          11,
        ],
      ]
    `);
  });

  test('Paging before, one result', async () => {
    const adapter = createMockAdapter();
    const context = createMockContext(adapter);
    adapter.query.mockImplementation((_transaction, _query, _values) =>
      Promise.resolve({ rows: [createEntityDbRow(2)] }),
    );
    const result = await adminEntitySearchEntities(
      adapter,
      createTestAdminSchema(),
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
              "status": "draft",
              "type": "TitleOnly",
              "updatedAt": 2021-08-17T07:51:25.560Z,
              "valid": true,
              "validPublished": null,
              "version": 0,
            },
          ],
          "hasMore": false,
        },
      }
    `);
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      [
        [
          "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated, e.status, e.invalid, ev.version, ev.schema_version, ev.encode_version, ev.data
        FROM entities e, entity_versions ev WHERE e.latest_draft_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id < $2 ORDER BY e.id LIMIT $3",
          "none",
          1,
          11,
        ],
      ]
    `);
  });
});
