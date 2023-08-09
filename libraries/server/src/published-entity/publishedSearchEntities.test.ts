import { ok } from '@dossierhq/core';
import { expectResultValue } from '@dossierhq/core-vitest';
import type { DatabasePublishedEntitySearchPayloadEntity } from '@dossierhq/database-adapter';
import { describe, expect, test } from 'vitest';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils.js';
import { adminTestSchema, publishedTestSchema } from '../test/TestSchema.js';
import { publishedSearchEntities } from './publishedSearchEntities.js';

describe('publishedSearchEntities', () => {
  test('Minimal (no results)', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    databaseAdapter.publishedEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(ok({ hasMore: true, entities: [] })),
    );

    const result = await publishedSearchEntities(
      adminTestSchema,
      publishedTestSchema,
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
            "publishedEntitySearchEntities",
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

    databaseAdapter.publishedEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(
        ok({
          hasMore: false,
          entities: [createDatabaseEntity()],
        }),
      ),
    );

    const result = await publishedSearchEntities(
      adminTestSchema,
      publishedTestSchema,
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
                  "type": "TitleOnly",
                  "valid": true,
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
            "publishedEntitySearchEntities",
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

    databaseAdapter.publishedEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(ok({ hasMore: false, entities: [createDatabaseEntity(2)] })),
    );
    // check if hasPreviousPage
    databaseAdapter.publishedEntitySearchEntities.mockReturnValueOnce(
      Promise.resolve(ok({ hasMore: true, entities: [] })),
    );

    const result = await publishedSearchEntities(
      adminTestSchema,
      publishedTestSchema,
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
                  "type": "TitleOnly",
                  "valid": true,
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
            "publishedEntitySearchEntities",
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
            "publishedEntitySearchEntities",
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

function createDatabaseEntity(id = 1): DatabasePublishedEntitySearchPayloadEntity {
  return {
    id: `id-${id}`,
    cursor: `cursor-${id}`,
    name: 'TitleOnly name',
    type: 'TitleOnly',
    authKey: 'none',
    validPublished: true,
    createdAt: new Date('2022-03-15T08:51:25.56Z'),
    entityFields: { schemaVersion: 1, encodeVersion: 1, fields: { title: 'Title' } },
  };
}
