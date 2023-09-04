import { AdminEntityStatus, ok } from '@dossierhq/core';
import { expectResultValue } from '@dossierhq/core-vitest';
import { describe, expect, test } from 'vitest';
import { ENCODE_VERSION_AS_IS } from '../shared-entity/migrateDecodeAndNormalizeEntityFields.js';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils.js';
import { adminTestSchema } from '../test/TestSchema.js';
import { adminPublishEntities } from './adminPublishEntities.js';

describe('Admin adminPublishEntities', () => {
  test('Minimal', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const now = new Date();

    databaseAdapter.adminEntityPublishGetVersionInfo.mockReturnValueOnce(
      Promise.resolve(
        ok({
          entityInternalId: 999,
          entityVersionInternalId: 888,
          id: '123',
          type: 'TitleOnly',
          name: 'Version name',
          publishedName: 'Published name',
          versionIsPublished: false,
          versionIsLatest: true,
          authKey: 'none',
          resolvedAuthKey: 'none',
          status: AdminEntityStatus.draft,
          validPublished: null,
          updatedAt: new Date('2021-08-17T07:51:25.56Z'),
          entityFields: {
            schemaVersion: 1,
            encodeVersion: ENCODE_VERSION_AS_IS,
            fields: { title: 'Title' },
          },
        }),
      ),
    );
    databaseAdapter.adminEntityPublishUpdateEntity.mockResolvedValueOnce(
      ok({ updatedAt: now, publishedName: 'Version name#123456' }),
    );
    databaseAdapter.adminEntityGetReferenceEntitiesInfo.mockResolvedValueOnce(ok([]));
    databaseAdapter.adminEntityCreateEntityEvent.mockResolvedValueOnce(ok(undefined));
    databaseAdapter.adminEntityIndexesUpdatePublished.mockResolvedValueOnce(ok(undefined));
    databaseAdapter.adminEntityUniqueIndexGetValues.mockResolvedValueOnce(ok([]));

    const result = await adminPublishEntities(
      adminTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      [{ id: '123', version: 5 }],
    );

    expectResultValue(result, [
      {
        id: '123',
        status: AdminEntityStatus.published,
        effect: 'published',
        updatedAt: now,
      },
    ]);
    expect(getDatabaseAdapterMockedCallsWithoutContextAndUnordered(databaseAdapter))
      .toMatchInlineSnapshot(`
        [
          [
            "adminEntityCreateEntityEvent",
            {
              "references": [
                {
                  "entityVersionInternalId": 888,
                  "publishedName": "Version name#123456",
                },
              ],
              "session": {
                "subjectId": "subject-id",
                "subjectInternalId": 123,
              },
              "type": "publishEntities",
            },
            null,
          ],
          [
            "adminEntityGetReferenceEntitiesInfo",
            [],
          ],
          [
            "adminEntityIndexesUpdatePublished",
            {
              "entityInternalId": 999,
            },
            {
              "fullTextSearchText": "Title",
              "locations": [],
              "referenceIds": [],
              "valueTypes": [],
            },
          ],
          [
            "adminEntityPublishGetVersionInfo",
            {
              "id": "123",
              "version": 5,
            },
          ],
          [
            "adminEntityPublishUpdateEntity",
            [Function],
            {
              "changePublishedName": true,
              "entityInternalId": 999,
              "entityVersionInternalId": 888,
              "publishedName": "Version name",
              "status": "published",
            },
            null,
          ],
          [
            "adminEntityUniqueIndexGetValues",
            {
              "entityInternalId": 999,
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
});
