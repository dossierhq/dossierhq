import { AdminEntityStatus, ErrorType, ok } from '@dossierhq/core';
import { expectErrorResult, expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils.js';
import { adminTestSchema } from '../test/TestSchema.js';
import { adminCreateEntity } from './adminCreateEntity.js';

describe('Admin adminCreateEntity', () => {
  test('Minimal', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const now = new Date();

    databaseAdapter.adminEntityCreate.mockReturnValueOnce(
      Promise.resolve(
        ok({
          entityInternalId: 123,
          id: '123',
          name: 'TitleOnly name',
          createdAt: now,
          updatedAt: now,
        }),
      ),
    );
    databaseAdapter.adminEntityIndexesUpdateLatest.mockReturnValueOnce(
      Promise.resolve(ok(undefined)),
    );

    const result = await adminCreateEntity(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      {
        info: { name: 'TitleOnly name', type: 'TitleOnly' },
        fields: { title: 'Title' },
      },
      undefined,
    );

    expectResultValue(result, {
      effect: 'created',
      entity: {
        id: '123',
        info: {
          type: 'TitleOnly',
          name: 'TitleOnly name',
          authKey: '',
          version: 1,
          createdAt: now,
          updatedAt: now,
          status: AdminEntityStatus.draft,
          valid: true,
          validPublished: null,
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
              "encodeVersion": 1,
              "fields": {
                "title": "Title",
              },
              "id": null,
              "name": "TitleOnly name",
              "publish": false,
              "resolvedAuthKey": {
                "authKey": "",
                "resolvedAuthKey": "",
              },
              "schemaVersion": 1,
              "session": {
                "subjectId": "subject-id",
                "subjectInternalId": 123,
                "type": "write",
              },
              "type": "TitleOnly",
              "version": 1,
            },
            null,
          ],
          [
            "adminEntityIndexesUpdateLatest",
            {
              "entityInternalId": 123,
            },
            {
              "componentTypes": [],
              "fullTextSearchText": "Title",
              "locations": [],
              "referenceIds": [],
            },
            true,
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
      authorizationAdapter,
      databaseAdapter,
      context,
      {
        info: { type: 'Invalid', name: 'name' },
        fields: { foo: 'title' },
      },
      undefined,
    );

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.info.type: Entity type Invalid doesn’t exist',
    );
    expect(
      getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter),
    ).toMatchInlineSnapshot('[]');
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
        info: { type: '', name: 'Foo' },
        fields: { foo: 'title' },
      },
      undefined,
    );

    expectErrorResult(result, ErrorType.BadRequest, 'entity.info.type: Type is required');
    expect(
      getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter),
    ).toMatchInlineSnapshot('[]');
  });

  test('Error: Create with newline in single line string field', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    const result = await adminCreateEntity(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      {
        info: { type: 'TitleOnly', name: 'TitleOnly' },
        fields: { title: 'Hello\nWorld\n' },
      },
      undefined,
    );

    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.fields.title: Value cannot contain line breaks',
    );
    expect(
      getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter),
    ).toMatchInlineSnapshot('[]');
  });
});
