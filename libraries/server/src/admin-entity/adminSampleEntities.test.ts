import { AdminEntityStatus, ok } from '@jonasb/datadata-core';
import { expectResultValue } from '@jonasb/datadata-core-jest';
import { Temporal } from '@js-temporal/polyfill';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils';
import { adminTestSchema } from '../test/TestSchema';
import { adminSampleEntities } from './adminSampleEntities';

describe('Admin adminSampleEntities', () => {
  test('No result', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }]))
    );
    databaseAdapter.adminEntitySearchTotalCount.mockReturnValueOnce(Promise.resolve(ok(0)));
    databaseAdapter.adminEntitySampleEntities.mockResolvedValueOnce(Promise.resolve(ok([])));

    const result = await adminSampleEntities(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      { seed: 9876 }
    );

    expectResultValue(result, { seed: 9876, totalCount: 0, items: [] });
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
      Array [
        Array [
          "adminEntitySearchTotalCount",
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

  test('One result', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const now = Temporal.Now.instant();

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }]))
    );
    databaseAdapter.adminEntitySearchTotalCount.mockReturnValueOnce(Promise.resolve(ok(1)));
    databaseAdapter.adminEntitySampleEntities.mockResolvedValueOnce(
      Promise.resolve(
        ok([
          {
            id: '123',
            type: 'TitleOnly',
            name: 'TitleOnly name',
            version: 0,
            authKey: 'none',
            status: AdminEntityStatus.published,
            createdAt: now,
            updatedAt: now,
            fieldValues: {},
          },
        ])
      )
    );

    const result = await adminSampleEntities(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      { seed: 3435 }
    );

    expectResultValue(result, {
      seed: 3435,
      totalCount: 1,
      items: [
        {
          id: '123',
          info: {
            authKey: 'none',
            type: 'TitleOnly',
            createdAt: now,
            updatedAt: now,
            version: 0,
            status: AdminEntityStatus.published,
            name: 'TitleOnly name',
          },
          fields: { title: null },
        },
      ],
    });
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
      Array [
        Array [
          "adminEntitySampleEntities",
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
          0,
          25,
          Array [
            Object {
              "authKey": "none",
              "resolvedAuthKey": "none",
            },
          ],
        ],
        Array [
          "adminEntitySearchTotalCount",
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
