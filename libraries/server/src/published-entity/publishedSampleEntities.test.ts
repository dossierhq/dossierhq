import { ok } from '@jonasb/datadata-core';
import { expectResultValue } from '@jonasb/datadata-core-vitest';
import { describe, expect, test } from 'vitest';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils.js';
import { publishedTestSchema } from '../test/TestSchema.js';
import { publishedSampleEntities } from './publishedSampleEntities.js';

describe('Published publishedSampleEntities', () => {
  test('No result', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }]))
    );
    databaseAdapter.publishedEntitySearchTotalCount.mockReturnValueOnce(Promise.resolve(ok(0)));
    databaseAdapter.publishedEntitySampleEntities.mockResolvedValueOnce(ok([]));

    const result = await publishedSampleEntities(
      publishedTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      { seed: 777 }
    );

    expectResultValue(result, { seed: 777, totalCount: 0, items: [] });
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
        [
          [
            "publishedEntitySearchTotalCount",
            _SessionContextImpl {
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
            },
            undefined,
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

  test('One result', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const now = new Date();

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }]))
    );
    databaseAdapter.publishedEntitySearchTotalCount.mockReturnValueOnce(Promise.resolve(ok(1)));
    databaseAdapter.publishedEntitySampleEntities.mockResolvedValueOnce(
      ok([
        {
          id: '123',
          type: 'TitleOnly',
          name: 'TitleOnly name',
          authKey: 'none',
          createdAt: now,
          fieldValues: {},
        },
      ])
    );

    const result = await publishedSampleEntities(
      publishedTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      { seed: 312 }
    );

    expectResultValue(result, {
      seed: 312,
      totalCount: 1,
      items: [
        {
          id: '123',
          info: {
            authKey: 'none',
            type: 'TitleOnly',
            createdAt: now,
            name: 'TitleOnly name',
          },
          fields: { title: null },
        },
      ],
    });
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
        [
          [
            "publishedEntitySampleEntities",
            _SessionContextImpl {
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
            },
            undefined,
            0,
            25,
            [
              {
                "authKey": "none",
                "resolvedAuthKey": "none",
              },
            ],
          ],
          [
            "publishedEntitySearchTotalCount",
            _SessionContextImpl {
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
            },
            undefined,
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
