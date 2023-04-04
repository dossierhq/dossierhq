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
import { adminUpdateEntity } from './adminUpdateEntity.js';

describe('Admin adminUpdateEntity', () => {
  test('Minimal', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const id = '123';
    const createdAt = new Date('2020-01-01T00:00:00.000Z');
    const now = new Date();

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
          valid: true,
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
    databaseAdapter.adminEntityUniqueIndexGetValues.mockReturnValueOnce(Promise.resolve(ok([])));

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
          valid: true,
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

  test('Error: No change to invalid entity', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const id = '123';
    const createdAt = new Date('2020-01-01T00:00:00.000Z');

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
          valid: false,
          version: 0,
          createdAt,
          updatedAt: createdAt,
          fieldValues: { title: 'Old title' },
        })
      )
    );

    const result = await adminUpdateEntity(
      adminTestSchema,
      publishedTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      { id, fields: {} },
      undefined
    );

    expectErrorResult(result, ErrorType.BadRequest, 'No change to entity that is already invalid');
    expect(
      getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter)
    ).toMatchSnapshot();
  });
});
