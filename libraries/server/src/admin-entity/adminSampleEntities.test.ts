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
import { adminSampleEntities } from './adminSampleEntities.js';

describe('Admin adminSampleEntities', () => {
  test('No result', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }])),
    );
    databaseAdapter.adminEntitySearchTotalCount.mockReturnValueOnce(Promise.resolve(ok(0)));
    databaseAdapter.adminEntitySampleEntities.mockResolvedValueOnce(ok([]));

    const result = await adminSampleEntities(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      { seed: 9876 },
    );

    expectResultValue(result, { seed: 9876, totalCount: 0, items: [] });
    expect(
      getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter),
    ).toMatchSnapshot();
  });

  test('One result', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const now = new Date();

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }])),
    );
    databaseAdapter.adminEntitySearchTotalCount.mockReturnValueOnce(Promise.resolve(ok(1)));
    databaseAdapter.adminEntitySampleEntities.mockResolvedValueOnce(
      ok([
        {
          id: '123',
          type: 'TitleOnly',
          name: 'TitleOnly name',
          version: 0,
          authKey: 'none',
          status: AdminEntityStatus.published,
          valid: true,
          validPublished: true,
          createdAt: now,
          updatedAt: now,
          schemaVersion: 1,
          fieldValues: {},
        },
      ]),
    );

    const result = await adminSampleEntities(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      { seed: 3435 },
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
            valid: true,
            validPublished: true,
            name: 'TitleOnly name',
          },
          fields: { title: null },
        },
      ],
    });
    expect(
      getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter),
    ).toMatchSnapshot();
  });

  test('No result - float seed', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }])),
    );
    databaseAdapter.adminEntitySearchTotalCount.mockReturnValueOnce(Promise.resolve(ok(0)));
    databaseAdapter.adminEntitySampleEntities.mockResolvedValueOnce(ok([]));

    const result = await adminSampleEntities(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      undefined,
      { seed: 0.123456789 },
    );

    expectResultValue(result, { seed: 0.123456789, totalCount: 0, items: [] });
    expect(
      getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter),
    ).toMatchSnapshot();
  });
});
