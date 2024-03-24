import { expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import type { SearchPublishedEntitiesItem } from '../search/QueryGenerator.js';
import {
  createMockAdapter,
  createMockContext,
  createTestAdminSchema,
  getQueryCalls,
  resolvePaging,
} from '../test/TestUtils.js';
import { publishedEntitySearchEntities } from './searchEntities.js';

function createEntityDbRow(id: number): SearchPublishedEntitiesItem {
  return {
    id,
    uuid: `uuid-${id}`,
    type: 'TitleOnly',
    published_name: `Title#${id}`,
    invalid: 0,
    auth_key: '',
    created_at: new Date('2021-08-17T07:51:25.56Z'),
    schema_version: 1,
    encode_version: 1,
    data: { title: 'Title' },
  };
}

const defaultAuthKeys = [{ authKey: '', resolvedAuthKey: '' }];

describe('publishedEntitySearchEntities', () => {
  test('Minimal, no results', async () => {
    const adapter = createMockAdapter();
    const context = createMockContext(adapter);
    adapter.query.mockImplementation((_transaction, _query, _values) =>
      Promise.resolve({ rows: [] }),
    );
    const result = await publishedEntitySearchEntities(
      adapter,
      createTestAdminSchema().toPublishedSchema(),
      context,
      undefined,
      resolvePaging(undefined),
      defaultAuthKeys,
    );
    expectResultValue(result, { edges: [], hasMore: false });
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      [
        [
          "SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.invalid, ev.schema_version, ev.encode_version, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
          "",
          26,
        ],
      ]
    `);
  });

  test('Minimal, one result', async () => {
    const adapter = createMockAdapter();
    const context = createMockContext(adapter);
    adapter.query.mockImplementation((_transaction, _query, _values) =>
      Promise.resolve({ rows: [createEntityDbRow(1)] }),
    );
    const result = await publishedEntitySearchEntities(
      adapter,
      createTestAdminSchema().toPublishedSchema(),
      context,
      undefined,
      resolvePaging(undefined),
      defaultAuthKeys,
    );
    expect(result).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "edges": [
            {
              "authKey": "",
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
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      [
        [
          "SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.invalid, ev.schema_version, ev.encode_version, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 ORDER BY e.id LIMIT $2",
          "",
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
    const result = await publishedEntitySearchEntities(
      adapter,
      createTestAdminSchema().toPublishedSchema(),
      context,
      undefined,
      resolvePaging({ after: 'MQ==', first: 10 }),
      defaultAuthKeys,
    );
    expect(result).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "edges": [
            {
              "authKey": "",
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
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      [
        [
          "SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.invalid, ev.schema_version, ev.encode_version, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id > $2 ORDER BY e.id LIMIT $3",
          "",
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
    const result = await publishedEntitySearchEntities(
      adapter,
      createTestAdminSchema().toPublishedSchema(),
      context,
      undefined,
      resolvePaging({ before: 'MQ==', first: 10 }),
      defaultAuthKeys,
    );
    expect(result).toMatchInlineSnapshot(`
      OkResult {
        "value": {
          "edges": [
            {
              "authKey": "",
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
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      [
        [
          "SELECT e.id, e.uuid, e.type, e.published_name, e.auth_key, e.created_at, e.invalid, ev.schema_version, ev.encode_version, ev.data FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = $1 AND e.id < $2 ORDER BY e.id LIMIT $3",
          "",
          1,
          11,
        ],
      ]
    `);
  });
});
