import { AdminEntityStatus, ErrorType, ok } from '@dossierhq/core';
import { expectErrorResult, expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils.js';
import { adminTestSchema, publishedTestSchema } from '../test/TestSchema.js';
import { adminCreateEntity } from './adminCreateEntity.js';

describe('Admin adminCreateEntity', () => {
  test('Minimal', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const now = new Date();

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }]))
    );
    databaseAdapter.adminEntityCreate.mockReturnValueOnce(
      Promise.resolve(
        ok({
          entityInternalId: 123,
          id: '123',
          name: 'TitleOnly name',
          createdAt: now,
          updatedAt: now,
        })
      )
    );

    const result = await adminCreateEntity(
      adminTestSchema,
      publishedTestSchema,
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
          valid: true,
        },
        fields: {
          title: 'Title',
        },
      },
    });
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
        [
          [
            "adminEntityCreate",
            [Function],
            {
              "creator": {
                "subjectId": "subject-id",
                "subjectInternalId": 123,
              },
              "fieldsData": {
                "title": "Title",
              },
              "fullTextSearchText": "Title",
              "id": null,
              "locations": [],
              "name": "TitleOnly name",
              "referenceIds": [],
              "resolvedAuthKey": {
                "authKey": "none",
                "resolvedAuthKey": "none",
              },
              "type": "TitleOnly",
              "valueTypes": [],
            },
          ],
          [
            "withRootTransaction",
            [Function],
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
      publishedTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      {
        info: { type: 'Invalid', name: 'name', authKey: 'none' },
        fields: { foo: 'title' },
      },
      undefined
    );

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.info.type: Entity type Invalid doesn’t exist'
    );
    expect(
      getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter)
    ).toMatchInlineSnapshot('[]');
  });

  test('Error: Create without type', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    const result = await adminCreateEntity(
      adminTestSchema,
      publishedTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      {
        info: { type: '', name: 'Foo', authKey: 'none' },
        fields: { foo: 'title' },
      },
      undefined
    );

    expectErrorResult(result, ErrorType.BadRequest, 'entity.info.type: Type is required');
    expect(
      getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter)
    ).toMatchInlineSnapshot('[]');
  });

  test('Error: Create with newline in single line string field', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }]))
    );

    const result = await adminCreateEntity(
      adminTestSchema,
      publishedTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      {
        info: { type: 'TitleOnly', name: 'TitleOnly', authKey: 'none' },
        fields: { title: 'Hello\nWorld\n' },
      },
      undefined
    );

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.fields.title: multiline string not allowed'
    );
    expect(
      getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter)
    ).toMatchInlineSnapshot('[]');
  });
});
