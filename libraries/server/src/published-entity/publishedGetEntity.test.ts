import { ok } from '@dossierhq/core';
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
import { publishedGetEntity } from './publishedGetEntity.js';

function mockPublishedEntityGetOneCall(
  databaseAdapter: MockDatabaseAdapter,
  {
    type,
    encodeVersion,
    fields,
  }: { type: string; encodeVersion?: number; fields: Record<string, unknown> },
) {
  const date = new Date('2023-08-09T08:22:35.810Z');

  databaseAdapter.publishedEntityGetOne.mockReturnValueOnce(
    Promise.resolve(
      ok({
        id: '123',
        name: 'Name',
        type,
        authKey: '',
        resolvedAuthKey: '',
        createdAt: date,
        validPublished: true,
        entityFields: {
          schemaVersion: 1,
          encodeVersion: encodeVersion ?? ENCODE_VERSION_AS_IS,
          fields,
        },
      }),
    ),
  );
}

describe('publishedGetEntity', () => {
  test('Minimal', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });

    mockPublishedEntityGetOneCall(databaseAdapter, {
      type: 'TitleOnly',
      fields: { title: 'Title' },
    });

    const result = await publishedGetEntity(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      { id: '123' },
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

    mockPublishedEntityGetOneCall(databaseAdapter, {
      type: 'ComponentsEntity',
      encodeVersion: ENCODE_VERSION_LEGACY,
      fields: {
        // References were stored as just the id
        normal: { type: 'ReferencesComponent', normal: '12345', list: ['23456', '34567'] },
        list: [
          // Locations were stored as [lat, lng]
          {
            type: 'LocationsComponent',
            normal: [1, 2],
            list: [
              [3, 4],
              [5, 6],
            ],
          },
        ],
      },
    });

    const result = await publishedGetEntity(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      { id: '123' },
    );

    expect(result.valueOrThrow()).toMatchSnapshot();
  });
});
