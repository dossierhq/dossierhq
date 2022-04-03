import { AdminEntityStatus, ErrorType, ok } from '@jonasb/datadata-core';
import { expectErrorResult, expectResultValue } from '@jonasb/datadata-core-jest';
import { Temporal } from '@js-temporal/polyfill';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils';
import { adminTestSchema } from '../test/TestSchema';
import { adminCreateEntity } from './adminCreateEntity';

describe('Admin adminCreateEntity', () => {
  test('Minimal', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const now = Temporal.Now.instant();

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }]))
    );
    databaseAdapter.adminEntityCreate.mockReturnValueOnce(
      Promise.resolve(ok({ id: '123', name: 'TitleOnly name', createdAt: now, updatedAt: now }))
    );

    const result = await adminCreateEntity(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      {
        info: { name: 'TitleOnly name', authKey: 'none', type: 'TitleOnly' },
        fields: { title: 'Title' },
      },
      undefined
    );

    expectResultValue(result, {
      effect: 'created',
      entity: {
        id: '123',
        info: {
          type: 'TitleOnly',
          name: 'TitleOnly name',
          authKey: 'none',
          version: 0,
          createdAt: now,
          updatedAt: now,
          status: AdminEntityStatus.draft,
        },
        fields: {
          title: 'Title',
        },
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
            "fieldsData": Object {
              "title": "Title",
            },
            "fullTextSearchText": "Title",
            "id": null,
            "locations": Array [],
            "name": "TitleOnly name",
            "referenceIds": Array [],
            "resolvedAuthKey": Object {
              "authKey": "none",
              "resolvedAuthKey": "none",
            },
            "type": "TitleOnly",
          },
        ],
        Array [
          "withRootTransaction",
          [Function],
        ],
      ]
    `);
  });

  test('Error: Create with invalid type', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    const result = await adminCreateEntity(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      {
        info: { type: 'Invalid', name: 'name', authKey: 'none' },
        fields: { foo: 'title' },
      },
      undefined
    );

    expectErrorResult(result, ErrorType.BadRequest, 'Entity type Invalid doesn’t exist');
    expect(
      getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter)
    ).toMatchInlineSnapshot(`Array []`);
  });

  test('Error: Create without type', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    const result = await adminCreateEntity(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      {
        info: { type: '', name: 'Foo', authKey: 'none' },
        fields: { foo: 'title' },
      },
      undefined
    );

    expectErrorResult(result, ErrorType.BadRequest, 'Missing entity.info.type');
    expect(
      getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter)
    ).toMatchInlineSnapshot(`Array []`);
  });
});
