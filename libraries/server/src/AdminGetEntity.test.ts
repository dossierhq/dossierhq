import { CoreTestUtils, AdminEntityStatus, ok } from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import { adminGetEntity } from './EntityAdmin';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from './test/AdditionalTestUtils';
import { adminTestSchema } from './test/TestSchema';

const { expectResultValue } = CoreTestUtils;

describe('Admin adminGetEntity', () => {
  test('Minimal', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const now = Temporal.Now.instant();

    databaseAdapter.adminEntityGetOne.mockReturnValueOnce(
      Promise.resolve(
        ok({
          id: '123',
          name: 'TitleOnly name',
          type: 'TitleOnly',
          authKey: 'none',
          resolvedAuthKey: 'none',
          version: 1,
          status: AdminEntityStatus.modified,
          createdAt: now,
          updatedAt: now,
          fieldValues: { title: 'Title' },
        })
      )
    );
    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok({ none: 'none' }))
    );

    const result = await adminGetEntity(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      { id: '123', version: 3, authKeys: ['none'] }
    );

    expectResultValue(result, {
      id: '123',
      info: {
        type: 'TitleOnly',
        name: 'TitleOnly name',
        authKey: 'none',
        version: 1,
        createdAt: now,
        updatedAt: now,
        status: AdminEntityStatus.modified,
      },
      fields: {
        title: 'Title',
      },
    });
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
      Array [
        Array [
          "adminEntityGetOne",
          Object {
            "id": "123",
            "version": 3,
          },
        ],
      ]
    `);
  });
});
