import { AdminEntityStatus, ok } from '@dossierhq/core';
import { expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils.js';
import { adminTestSchema } from '../test/TestSchema.js';
import { adminGetEntity } from './adminGetEntity.js';

describe('Admin adminGetEntity', () => {
  test('Minimal', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const now = new Date();

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
          valid: true,
          validPublished: true,
          createdAt: now,
          updatedAt: now,
          entityFields: {
            schemaVersion: 1,
            encodeVersion: 0,
            fields: { title: 'Title' },
          },
        }),
      ),
    );
    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }])),
    );

    const result = await adminGetEntity(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      { id: '123', version: 3 },
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
        valid: true,
        validPublished: true,
      },
      fields: {
        title: 'Title',
      },
    });
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
        [
          [
            "adminEntityGetOne",
            {
              "id": "123",
              "version": 3,
            },
          ],
        ]
      `);
  });
});
