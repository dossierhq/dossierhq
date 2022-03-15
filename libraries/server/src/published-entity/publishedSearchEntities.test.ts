import { ok } from '@jonasb/datadata-core';
import { expectResultValue } from '@jonasb/datadata-core-jest';
import type { DatabasePublishedEntitySearchPayloadEntity } from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils';
import { adminTestSchema } from '../test/TestSchema';
import { publishedSearchEntities } from './publishedSearchEntities';

describe('publishedSearchEntities', () => {
  test('Minimal (no results)', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }]))
    );
    databaseAdapter.publishedEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(ok({ hasMore: true, entities: [] }))
    );

    const result = await publishedSearchEntities(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      undefined
    );

    expectResultValue(result, null);

    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
      Array [
        Array [
          "publishedEntitySearchEntities",
          SessionContextImpl {
            "defaultAuthKeys": Array [
              "none",
            ],
            "logger": Object {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
            "session": Object {
              "subjectId": "subject-id",
              "subjectInternalId": 123,
            },
            "transaction": null,
          },
          undefined,
          Object {
            "after": null,
            "before": null,
            "count": 25,
            "forwards": true,
          },
          Array [
            Object {
              "authKey": "none",
              "resolvedAuthKey": "none",
            },
          ],
        ],
      ]
    `);
  });

  test('Minimal (one result)', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }]))
    );
    databaseAdapter.publishedEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(
        ok({
          hasMore: false,
          entities: [createDatabaseEntity()],
        })
      )
    );

    const result = await publishedSearchEntities(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      undefined
    );

    expect(result.valueOrThrow()).toMatchInlineSnapshot(`
      Object {
        "edges": Array [
          Object {
            "cursor": "cursor-1",
            "node": OkResult {
              "value": Object {
                "fields": Object {
                  "title": "Title",
                },
                "id": "id-1",
                "info": Object {
                  "authKey": "none",
                  "createdAt": "2022-03-15T08:51:25.56Z",
                  "name": "TitleOnly name",
                  "type": "TitleOnly",
                },
              },
            },
          },
        ],
        "pageInfo": Object {
          "endCursor": "cursor-1",
          "hasNextPage": false,
          "hasPreviousPage": false,
          "startCursor": "cursor-1",
        },
      }
    `);

    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
      Array [
        Array [
          "publishedEntitySearchEntities",
          SessionContextImpl {
            "defaultAuthKeys": Array [
              "none",
            ],
            "logger": Object {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
            "session": Object {
              "subjectId": "subject-id",
              "subjectInternalId": 123,
            },
            "transaction": null,
          },
          undefined,
          Object {
            "after": null,
            "before": null,
            "count": 25,
            "forwards": true,
          },
          Array [
            Object {
              "authKey": "none",
              "resolvedAuthKey": "none",
            },
          ],
        ],
      ]
    `);
  });

  test('After', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }]))
    );
    databaseAdapter.publishedEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(ok({ hasMore: false, entities: [createDatabaseEntity(2)] }))
    );
    // check if hasPreviousPage
    databaseAdapter.publishedEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(ok({ hasMore: true, entities: [] }))
    );

    const result = await publishedSearchEntities(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      { after: 'cursor-1' }
    );

    expect(result.valueOrThrow()).toMatchInlineSnapshot(`
      Object {
        "edges": Array [
          Object {
            "cursor": "cursor-2",
            "node": OkResult {
              "value": Object {
                "fields": Object {
                  "title": "Title",
                },
                "id": "id-2",
                "info": Object {
                  "authKey": "none",
                  "createdAt": "2022-03-15T08:51:25.56Z",
                  "name": "TitleOnly name",
                  "type": "TitleOnly",
                },
              },
            },
          },
        ],
        "pageInfo": Object {
          "endCursor": "cursor-2",
          "hasNextPage": false,
          "hasPreviousPage": true,
          "startCursor": "cursor-2",
        },
      }
    `);

    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
      Array [
        Array [
          "publishedEntitySearchEntities",
          SessionContextImpl {
            "defaultAuthKeys": Array [
              "none",
            ],
            "logger": Object {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
            "session": Object {
              "subjectId": "subject-id",
              "subjectInternalId": 123,
            },
            "transaction": null,
          },
          undefined,
          Object {
            "after": "cursor-1",
            "before": null,
            "count": 25,
            "forwards": true,
          },
          Array [
            Object {
              "authKey": "none",
              "resolvedAuthKey": "none",
            },
          ],
        ],
        Array [
          "publishedEntitySearchEntities",
          SessionContextImpl {
            "defaultAuthKeys": Array [
              "none",
            ],
            "logger": Object {
              "debug": [Function],
              "error": [Function],
              "info": [Function],
              "warn": [Function],
            },
            "session": Object {
              "subjectId": "subject-id",
              "subjectInternalId": 123,
            },
            "transaction": null,
          },
          undefined,
          Object {
            "after": null,
            "before": "cursor-1",
            "count": 0,
            "forwards": false,
          },
          Array [
            Object {
              "authKey": "none",
              "resolvedAuthKey": "none",
            },
          ],
        ],
      ]
    `);
  });
});

function createDatabaseEntity(id = 1): DatabasePublishedEntitySearchPayloadEntity {
  return {
    id: `id-${id}`,
    cursor: `cursor-${id}`,
    name: 'TitleOnly name',
    type: 'TitleOnly',
    authKey: 'none',
    createdAt: Temporal.Instant.from('2022-03-15T08:51:25.56Z'),
    fieldValues: { title: 'Title' },
  };
}
