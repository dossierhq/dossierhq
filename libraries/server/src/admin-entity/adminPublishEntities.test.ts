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
import { adminPublishEntities } from './adminPublishEntities.js';

describe('Admin adminPublishEntities', () => {
  test('Minimal', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const now = Temporal.Now.instant();

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok([{ authKey: 'none', resolvedAuthKey: 'none' }]))
    );
    databaseAdapter.adminEntityPublishGetVersionInfo.mockReturnValueOnce(
      Promise.resolve(
        ok({
          entityInternalId: 999,
          entityVersionInternalId: 888,
          id: '123',
          type: 'TitleOnly',
          versionIsPublished: false,
          versionIsLatest: true,
          authKey: 'none',
          resolvedAuthKey: 'none',
          status: AdminEntityStatus.draft,
          updatedAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
          fieldValues: { title: 'Title' },
        })
      )
    );
    databaseAdapter.adminEntityPublishUpdateEntity.mockResolvedValueOnce(ok({ updatedAt: now }));
    databaseAdapter.adminEntityGetReferenceEntitiesInfo.mockResolvedValueOnce(ok([]));
    databaseAdapter.adminEntityPublishUpdatePublishedReferencesIndex.mockResolvedValueOnce(
      ok(undefined)
    );
    databaseAdapter.adminEntityPublishingCreateEvents.mockResolvedValueOnce(ok(undefined));

    const result = await adminPublishEntities(
      adminTestSchema,
      publishedTestSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      [{ id: '123', version: 5 }]
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
            "adminEntityGetReferenceEntitiesInfo",
            [],
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
            {
              "entityInternalId": 999,
              "entityVersionInternalId": 888,
              "fullTextSearchText": "Title",
              "locations": [],
              "status": "published",
            },
          ],
          [
            "adminEntityPublishUpdatePublishedReferencesIndex",
            {
              "entityInternalId": 999,
            },
            [],
          ],
          [
            "adminEntityPublishingCreateEvents",
            {
              "kind": "publish",
              "references": [
                {
                  "entityInternalId": 999,
                  "entityVersionInternalId": 888,
                },
              ],
              "session": {
                "subjectId": "subject-id",
                "subjectInternalId": 123,
              },
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
