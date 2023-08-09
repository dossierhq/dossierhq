import { AdminEntityStatus, ok } from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import {
  ENCODE_VERSION_AS_IS,
  ENCODE_VERSION_LEGACY,
} from '../shared-entity/migrateDecodeAndNormalizeEntityFields.js';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
  type MockDatabaseAdapter,
} from '../test/AdditionalTestUtils.js';
import { adminTestSchema } from '../test/TestSchema.js';
import { adminGetEntity } from './adminGetEntity.js';

function mockAdminEntityGetOneCall(
  databaseAdapter: MockDatabaseAdapter,
  {
    type,
    version,
    encodeVersion,
    fields,
  }: { type: string; version?: number; encodeVersion?: number; fields: Record<string, unknown> },
) {
  const date = new Date('2023-08-09T08:22:35.810Z');

  databaseAdapter.adminEntityGetOne.mockReturnValueOnce(
    Promise.resolve(
      ok({
        id: '123',
        name: 'Name',
        type,
        authKey: 'none',
        resolvedAuthKey: 'none',
        version: version ?? 1,
        status: AdminEntityStatus.draft,
        valid: true,
        validPublished: true,
        createdAt: date,
        updatedAt: date,
        entityFields: {
          schemaVersion: 1,
          encodeVersion: encodeVersion ?? ENCODE_VERSION_AS_IS,
          fields,
        },
      }),
    ),
  );
}

describe('adminGetEntity', () => {
  test('Minimal', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    mockAdminEntityGetOneCall(databaseAdapter, {
      type: 'TitleOnly',
      version: 3,
      fields: { title: 'Title' },
    });

    const result = await adminGetEntity(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      { id: '123', version: 3 },
    );

    expect(result.valueOrThrow()).toMatchSnapshot();
    expect(
      getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter),
    ).toMatchSnapshot();
  });

  test('Legacy codec', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    mockAdminEntityGetOneCall(databaseAdapter, {
      type: 'ValueItemsEntity',
      encodeVersion: ENCODE_VERSION_LEGACY,
      fields: {
        // References were stored as just the id
        normal: { type: 'EntitiesValueItem', normal: '12345', list: ['23456', '34567'] },
        list: [
          // Locations were stored as [lat, lng]
          {
            type: 'LocationsValueItem',
            normal: [1, 2],
            list: [
              [3, 4],
              [5, 6],
            ],
          },
        ],
      },
    });

    const result = await adminGetEntity(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      { id: '123', version: 1 },
    );

    expect(result.valueOrThrow()).toMatchSnapshot();
  });
});
