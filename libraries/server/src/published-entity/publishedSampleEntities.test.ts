import { ok } from '@dossierhq/core';
import { expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import { ENCODE_VERSION_AS_IS } from '../shared-entity/migrateDecodeAndNormalizeEntityFields.js';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils.js';
import { adminTestSchema, publishedTestSchema } from '../test/TestSchema.js';
import { publishedSampleEntities } from './publishedSampleEntities.js';

describe('Published publishedSampleEntities', () => {
  test('No result', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    databaseAdapter.publishedEntitySearchTotalCount.mockReturnValueOnce(Promise.resolve(ok(0)));
    databaseAdapter.publishedEntitySampleEntities.mockResolvedValueOnce(ok([]));

    const result = await publishedSampleEntities(
      adminTestSchema,
      publishedTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      { seed: 777 },
    );

    expectResultValue(result, { seed: 777, totalCount: 0, items: [] });
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
        [
          [
            "publishedEntitySearchTotalCount",
            SessionContextImpl {
              "databasePerformance": null,
              "defaultAuthKeys": [
                "",
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
                "type": "write",
              },
              "transaction": null,
            },
            undefined,
            [
              {
                "authKey": "",
                "resolvedAuthKey": "",
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

    databaseAdapter.publishedEntitySearchTotalCount.mockReturnValueOnce(Promise.resolve(ok(1)));
    databaseAdapter.publishedEntitySampleEntities.mockResolvedValueOnce(
      ok([
        {
          id: '123',
          type: 'TitleOnly',
          name: 'TitleOnly name',
          authKey: '',
          validPublished: true,
          createdAt: now,
          entityFields: { schemaVersion: 1, encodeVersion: ENCODE_VERSION_AS_IS, fields: {} },
        },
      ]),
    );

    const result = await publishedSampleEntities(
      adminTestSchema,
      publishedTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      { seed: 312 },
    );

    expectResultValue(result, {
      seed: 312,
      totalCount: 1,
      items: [
        {
          id: '123',
          info: {
            authKey: '',
            type: 'TitleOnly',
            createdAt: now,
            name: 'TitleOnly name',
            valid: true,
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
            SessionContextImpl {
              "databasePerformance": null,
              "defaultAuthKeys": [
                "",
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
                "type": "write",
              },
              "transaction": null,
            },
            undefined,
            0,
            25,
            [
              {
                "authKey": "",
                "resolvedAuthKey": "",
              },
            ],
          ],
          [
            "publishedEntitySearchTotalCount",
            SessionContextImpl {
              "databasePerformance": null,
              "defaultAuthKeys": [
                "",
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
                "type": "write",
              },
              "transaction": null,
            },
            undefined,
            [
              {
                "authKey": "",
                "resolvedAuthKey": "",
              },
            ],
          ],
        ]
      `);
  });
});
