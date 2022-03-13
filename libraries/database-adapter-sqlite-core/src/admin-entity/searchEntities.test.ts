import { expectResultValue } from '@jonasb/datadata-core-jest';
import type { SearchAdminEntitiesItem } from '../search/QueryGenerator';
import {
  createMockAdapter,
  createMockContext,
  createTestAdminSchema,
  getQueryCalls,
} from '../test/TestUtils';
import { adminEntitySearchEntities } from './searchEntities';

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
    version: 0,
    fields: JSON.stringify({ title: 'Title' }),
  };
}

describe('adminEntitySearchEntities', () => {
  test('Minimal, no results', async () => {
    const adapter = createMockAdapter();
    const context = (await createMockContext(adapter)).valueOrThrow();

    adapter.query.mockClear();
    adapter.query.mockImplementation(async (_query, _values) => []);
    const result = await adminEntitySearchEntities(
      adapter,
      createTestAdminSchema(),
      context,
      undefined,
      undefined,
      [{ authKey: 'none', resolvedAuthKey: 'none' }]
    );
    expectResultValue(result, { entities: [], hasPreviousPage: false, hasNextPage: false });
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      Array [
        Array [
          "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
          "none",
          26,
        ],
      ]
    `);
  });

  test('Minimal, one result', async () => {
    const adapter = createMockAdapter();
    const context = (await createMockContext(adapter)).valueOrThrow();

    adapter.query.mockClear();
    adapter.query.mockImplementation(async (_query, _values) => [createEntityDbRow(1)]);
    const result = await adminEntitySearchEntities(
      adapter,
      createTestAdminSchema(),
      context,
      undefined,
      undefined,
      [{ authKey: 'none', resolvedAuthKey: 'none' }]
    );
    expect(result).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "entities": Array [
            Object {
              "authKey": "none",
              "createdAt": "2021-08-17T07:51:25.56Z",
              "cursor": "MQ==",
              "fieldValues": Object {
                "title": "Title",
              },
              "id": "uuid-1",
              "name": "Title#1",
              "status": "draft",
              "type": "TitleOnly",
              "updatedAt": "2021-08-17T07:51:25.56Z",
              "version": 0,
            },
          ],
          "hasNextPage": false,
          "hasPreviousPage": false,
        },
      }
    `);
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      Array [
        Array [
          "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
          "none",
          26,
        ],
      ]
    `);
  });

  test('Paging after, one result', async () => {
    const adapter = createMockAdapter();
    const context = (await createMockContext(adapter)).valueOrThrow();

    adapter.query.mockClear();
    adapter.query.mockImplementation(async (_query, _values) => [createEntityDbRow(2)]);
    const result = await adminEntitySearchEntities(
      adapter,
      createTestAdminSchema(),
      context,
      undefined,
      { after: 'MQ==', first: 10 },
      [{ authKey: 'none', resolvedAuthKey: 'none' }]
    );
    expect(result).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "entities": Array [
            Object {
              "authKey": "none",
              "createdAt": "2021-08-17T07:51:25.56Z",
              "cursor": "Mg==",
              "fieldValues": Object {
                "title": "Title",
              },
              "id": "uuid-2",
              "name": "Title#2",
              "status": "draft",
              "type": "TitleOnly",
              "updatedAt": "2021-08-17T07:51:25.56Z",
              "version": 0,
            },
          ],
          "hasNextPage": false,
          "hasPreviousPage": false,
        },
      }
    `);
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      Array [
        Array [
          "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id > ?2 ORDER BY e.id LIMIT ?3",
          "none",
          1,
          11,
        ],
      ]
    `);
  });

  test('Paging before, one result', async () => {
    const adapter = createMockAdapter();
    const context = (await createMockContext(adapter)).valueOrThrow();

    adapter.query.mockClear();
    adapter.query.mockImplementation(async (_query, _values) => [createEntityDbRow(2)]);
    const result = await adminEntitySearchEntities(
      adapter,
      createTestAdminSchema(),
      context,
      undefined,
      { before: 'MQ==', first: 10 },
      [{ authKey: 'none', resolvedAuthKey: 'none' }]
    );
    expect(result).toMatchInlineSnapshot(`
      OkResult {
        "value": Object {
          "entities": Array [
            Object {
              "authKey": "none",
              "createdAt": "2021-08-17T07:51:25.56Z",
              "cursor": "Mg==",
              "fieldValues": Object {
                "title": "Title",
              },
              "id": "uuid-2",
              "name": "Title#2",
              "status": "draft",
              "type": "TitleOnly",
              "updatedAt": "2021-08-17T07:51:25.56Z",
              "version": 0,
            },
          ],
          "hasNextPage": false,
          "hasPreviousPage": false,
        },
      }
    `);
    expect(getQueryCalls(adapter)).toMatchInlineSnapshot(`
      Array [
        Array [
          "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, e.updated_at, e.updated_seq, e.status, ev.version, ev.fields
        FROM entities e, entity_versions ev WHERE e.latest_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id LIMIT ?3",
          "none",
          1,
          11,
        ],
      ]
    `);
  });
});
