import { AdminEntityStatus, ok } from '@dossierhq/core';
import { expectResultValue } from '@dossierhq/core-vitest';
import type { DatabaseAdminEntitySearchPayloadEntity } from '@dossierhq/database-adapter';
import { describe, expect, test } from 'vitest';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils.js';
import { adminTestSchema } from '../test/TestSchema.js';
import { adminSearchEntities } from './adminSearchEntities.js';

describe('Admin adminSearchEntities', () => {
  test('Minimal (no results)', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }])),
    );
    databaseAdapter.adminEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(ok({ hasMore: true, entities: [] })),
    );

    const result = await adminSearchEntities(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      undefined,
    );

    expectResultValue(result, null);
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
        [
          [
            "adminEntitySearchEntities",
            SessionContextImpl {
              "databasePerformance": null,
              "defaultAuthKeys": [
                "none",
              ],
              "logger": {
                "debug": [Function],
                "error": [Function],
                "info": [Function],
                "warn": [Function],
              },
              "session": {
                "subjectId": "subject-id",
                "subjectInternalId": 123,
              },
              "transaction": null,
              Symbol(SessionContext): undefined,
            },
            undefined,
            {
              "after": null,
              "afterInclusive": false,
              "before": null,
              "beforeInclusive": false,
              "count": 25,
              "forwards": true,
            },
            [
              {
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
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }])),
    );
    databaseAdapter.adminEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(
        ok({
          hasMore: false,
          entities: [createDatabaseEntity()],
        }),
      ),
    );

    const result = await adminSearchEntities(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      undefined,
    );

    expect(result.valueOrThrow()).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "cursor": "cursor-1",
            "node": OkResult {
              "value": {
                "fields": {
                  "title": "Title",
                },
                "id": "id-1",
                "info": {
                  "authKey": "none",
                  "createdAt": 2022-03-15T08:51:25.560Z,
                  "name": "TitleOnly name",
                  "status": "modified",
                  "type": "TitleOnly",
                  "updatedAt": 2022-03-16T08:51:25.560Z,
                  "valid": true,
                  "validPublished": true,
                  "version": 1,
                },
              },
            },
          },
        ],
        "pageInfo": {
          "endCursor": "cursor-1",
          "hasNextPage": false,
          "hasPreviousPage": false,
          "startCursor": "cursor-1",
        },
      }
    `);

    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
        [
          [
            "adminEntitySearchEntities",
            SessionContextImpl {
              "databasePerformance": null,
              "defaultAuthKeys": [
                "none",
              ],
              "logger": {
                "debug": [Function],
                "error": [Function],
                "info": [Function],
                "warn": [Function],
              },
              "session": {
                "subjectId": "subject-id",
                "subjectInternalId": 123,
              },
              "transaction": null,
              Symbol(SessionContext): undefined,
            },
            undefined,
            {
              "after": null,
              "afterInclusive": false,
              "before": null,
              "beforeInclusive": false,
              "count": 25,
              "forwards": true,
            },
            [
              {
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
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }])),
    );
    databaseAdapter.adminEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(ok({ hasMore: false, entities: [createDatabaseEntity(2)] })),
    );
    // check if hasPreviousPage
    databaseAdapter.adminEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(ok({ hasMore: true, entities: [] })),
    );

    const result = await adminSearchEntities(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      { after: 'cursor-1' },
    );

    expect(result.valueOrThrow()).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "cursor": "cursor-2",
            "node": OkResult {
              "value": {
                "fields": {
                  "title": "Title",
                },
                "id": "id-2",
                "info": {
                  "authKey": "none",
                  "createdAt": 2022-03-15T08:51:25.560Z,
                  "name": "TitleOnly name",
                  "status": "modified",
                  "type": "TitleOnly",
                  "updatedAt": 2022-03-16T08:51:25.560Z,
                  "valid": true,
                  "validPublished": true,
                  "version": 1,
                },
              },
            },
          },
        ],
        "pageInfo": {
          "endCursor": "cursor-2",
          "hasNextPage": false,
          "hasPreviousPage": true,
          "startCursor": "cursor-2",
        },
      }
    `);

    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
        [
          [
            "adminEntitySearchEntities",
            SessionContextImpl {
              "databasePerformance": null,
              "defaultAuthKeys": [
                "none",
              ],
              "logger": {
                "debug": [Function],
                "error": [Function],
                "info": [Function],
                "warn": [Function],
              },
              "session": {
                "subjectId": "subject-id",
                "subjectInternalId": 123,
              },
              "transaction": null,
              Symbol(SessionContext): undefined,
            },
            undefined,
            {
              "after": "cursor-1",
              "afterInclusive": false,
              "before": null,
              "beforeInclusive": false,
              "count": 25,
              "forwards": true,
            },
            [
              {
                "authKey": "none",
                "resolvedAuthKey": "none",
              },
            ],
          ],
          [
            "adminEntitySearchEntities",
            SessionContextImpl {
              "databasePerformance": null,
              "defaultAuthKeys": [
                "none",
              ],
              "logger": {
                "debug": [Function],
                "error": [Function],
                "info": [Function],
                "warn": [Function],
              },
              "session": {
                "subjectId": "subject-id",
                "subjectInternalId": 123,
              },
              "transaction": null,
              Symbol(SessionContext): undefined,
            },
            undefined,
            {
              "after": null,
              "afterInclusive": false,
              "before": "cursor-1",
              "beforeInclusive": true,
              "count": 0,
              "forwards": false,
            },
            [
              {
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
    valid: true,
    validPublished: true,
    createdAt: new Date('2022-03-15T08:51:25.56Z'),
    updatedAt: new Date('2022-03-16T08:51:25.56Z'),
    fieldValues: { title: 'Title' },
  };
}
