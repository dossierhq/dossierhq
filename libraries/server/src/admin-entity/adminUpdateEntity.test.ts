import { AdminEntityStatus, ok } from '@jonasb/datadata-core';
import { expectResultValue } from '@jonasb/datadata-core-vitest';
import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, test } from 'vitest';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils.js';
import { adminTestSchema, publishedTestSchema } from '../test/TestSchema.js';
import { adminUpdateEntity } from './adminUpdateEntity.js';

describe('Admin adminUpdateEntity', () => {
  test('Minimal', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const id = '123';
    const createdAt = Temporal.Instant.from('2020-01-01T00:00:00.000Z');
    const now = Temporal.Now.instant();

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }]))
    );
    databaseAdapter.adminEntityUpdateGetEntityInfo.mockReturnValueOnce(
      Promise.resolve(
        ok({
          entityInternalId: 'internal-123',
          type: 'TitleOnly',
          name: 'Old name',
          authKey: 'none',
          resolvedAuthKey: 'none',
          status: AdminEntityStatus.draft,
          version: 0,
          createdAt,
          updatedAt: createdAt,
          fieldValues: { title: 'Old title' },
        })
      )
    );
    databaseAdapter.adminEntityUpdateEntity.mockReturnValueOnce(
      Promise.resolve(ok({ name: 'Updated name#123456', version: 1, updatedAt: now }))
    );

    const result = await adminUpdateEntity(
      adminTestSchema,
      publishedTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      {
        id,
        info: { name: 'Updated name' },
        fields: { title: 'Updated title' },
      },
      undefined
    );

    expectResultValue(result, {
      effect: 'updated',
      entity: {
        id: '123',
        info: {
          type: 'TitleOnly',
          name: 'Updated name#123456',
          authKey: 'none',
          version: 1,
          createdAt: createdAt,
          updatedAt: now,
          status: AdminEntityStatus.draft,
        },
        fields: {
          title: 'Updated title',
        },
      },
    });
    expect(
      getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter)
    ).toMatchSnapshot();
  });
});
