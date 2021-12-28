import { CoreTestUtils, EntityPublishState, ok } from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import { adminCreateEntity } from './EntityAdmin';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from './test/AdditionalTestUtils';
import { adminTestSchema } from './test/TestSchema';

const { expectResultValue } = CoreTestUtils;

describe('Admin adminCreateEntity', () => {
  test('Minimal', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const now = Temporal.Now.instant();

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok({ none: 'none' }))
    );
    databaseAdapter.adminEntityCreate.mockReturnValueOnce(
      Promise.resolve(ok({ id: '123', name: 'Foo name', createdAt: now, updatedAt: now }))
    );

    const result = await adminCreateEntity(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      { info: { name: 'Foo name', authKey: 'none', type: 'Foo' }, fields: {} }
    );

    expectResultValue(result, {
      effect: 'created',
      entity: {
        id: '123',
        info: {
          type: 'Foo',
          name: 'Foo name',
          authKey: 'none',
          version: 0,
          createdAt: now,
          updatedAt: now,
          publishingState: EntityPublishState.Draft,
        },
        fields: {},
      },
    });
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
      Array [
        Array [
          "adminEntityCreate",
          [Function],
          Object {
            "creator": Object {
              "subjectId": "subject-id",
              "subjectInternalId": 123,
            },
            "fieldsData": Object {},
            "fullTextSearchText": "",
            "id": null,
            "locations": Array [],
            "name": "Foo name",
            "referenceIds": Array [],
            "resolvedAuthKey": Object {
              "authKey": "none",
              "resolvedAuthKey": "none",
            },
            "type": "Foo",
          },
        ],
        Array [
          "withRootTransaction",
        ],
      ]
    `);
  });
});
