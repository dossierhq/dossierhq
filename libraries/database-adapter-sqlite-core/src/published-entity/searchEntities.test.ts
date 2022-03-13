import { expectResultValue } from '@jonasb/datadata-core-jest';
import type { SearchPublishedEntitiesItem } from '../search/QueryGenerator';
import {
  createMockAdapter,
  createMockContext,
  createTestAdminSchema,
  getQueryCalls,
} from '../test/TestUtils';
import { publishedEntitySearchEntities } from './searchEntities';

function createEntityDbRow(id: number): SearchPublishedEntitiesItem {
  return {
    id,
    uuid: `uuid-${id}`,
    type: 'TitleOnly',
    name: `Title#${id}`,
    auth_key: 'none',
    created_at: '2021-08-17T07:51:25.56Z',
    fields: JSON.stringify({ title: 'Title' }),
  };
}

describe('publishedEntitySearchEntities', () => {
  test('Minimal, no results', async () => {
    const adapter = createMockAdapter();
    const context = (await createMockContext(adapter)).valueOrThrow();

    adapter.query.mockClear();
    adapter.query.mockImplementation(async (_query, _values) => []);
    const result = await publishedEntitySearchEntities(
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
          "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
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
    const result = await publishedEntitySearchEntities(
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
              "type": "TitleOnly",
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
          "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 ORDER BY e.id LIMIT ?2",
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
    const result = await publishedEntitySearchEntities(
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
              "type": "TitleOnly",
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
          "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id > ?2 ORDER BY e.id LIMIT ?3",
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
    const result = await publishedEntitySearchEntities(
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
              "type": "TitleOnly",
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
          "SELECT e.id, e.uuid, e.type, e.name, e.auth_key, e.created_at, ev.fields FROM entities e, entity_versions ev WHERE e.published_entity_versions_id = ev.id AND e.resolved_auth_key = ?1 AND e.id < ?2 ORDER BY e.id LIMIT ?3",
          "none",
          1,
          11,
        ],
      ]
    `);
  });
});
