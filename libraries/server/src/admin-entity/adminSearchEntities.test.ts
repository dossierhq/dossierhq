import { AdminEntityStatus, ok } from '@jonasb/datadata-core';
import { expectResultValue } from '@jonasb/datadata-core-jest';
import type { DatabaseAdminEntitySearchPayloadEntity } from '@jonasb/datadata-database-adapter';
import { Temporal } from '@js-temporal/polyfill';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils';
import { adminTestSchema } from '../test/TestSchema';
import { adminSearchEntities } from './adminSearchEntities';

describe('Admin adminSearchEntities', () => {
  test('Minimal (no results)', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }]))
    );
    databaseAdapter.adminEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(ok({ hasMore: true, entities: [] }))
    );

    const result = await adminSearchEntities(
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
          "adminEntitySearchEntities",
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
            "afterInclusive": false,
            "before": null,
            "beforeInclusive": false,
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
    databaseAdapter.adminEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(
        ok({
          hasMore: false,
          entities: [createDatabaseEntity()],
        })
      )
    );

    const result = await adminSearchEntities(
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
                  "status": "modified",
                  "type": "TitleOnly",
                  "updatedAt": "2022-03-16T08:51:25.56Z",
                  "version": 1,
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
          "adminEntitySearchEntities",
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
            "afterInclusive": false,
            "before": null,
            "beforeInclusive": false,
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
    databaseAdapter.adminEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(ok({ hasMore: false, entities: [createDatabaseEntity(2)] }))
    );
    // check if hasPreviousPage
    databaseAdapter.adminEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(ok({ hasMore: true, entities: [] }))
    );

    const result = await adminSearchEntities(
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
                  "status": "modified",
                  "type": "TitleOnly",
                  "updatedAt": "2022-03-16T08:51:25.56Z",
                  "version": 1,
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
          "adminEntitySearchEntities",
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
            "afterInclusive": false,
            "before": null,
            "beforeInclusive": false,
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
          "adminEntitySearchEntities",
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
            "afterInclusive": false,
            "before": "cursor-1",
            "beforeInclusive": true,
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

function createDatabaseEntity(id = 1): DatabaseAdminEntitySearchPayloadEntity {
  return {
    id: `id-${id}`,
    cursor: `cursor-${id}`,
    name: 'TitleOnly name',
    type: 'TitleOnly',
    authKey: 'none',
    version: 1,
    status: AdminEntityStatus.modified,
    createdAt: Temporal.Instant.from('2022-03-15T08:51:25.56Z'),
    updatedAt: Temporal.Instant.from('2022-03-16T08:51:25.56Z'),
    fieldValues: { title: 'Title' },
  };
}
