import { AdminEntityStatus, ok } from '@jonasb/datadata-core';
import { expectResultValue } from '@jonasb/datadata-core-jest';
import { Temporal } from '@js-temporal/polyfill';
import {
  createMockAuthorizationAdapter,
  createMockDatabaseAdapter,
  createMockSessionContext,
  getDatabaseAdapterMockedCallsWithoutContextAndUnordered,
} from '../test/AdditionalTestUtils';
import { adminTestSchema } from '../test/TestSchema';
import { adminPublishEntities } from './adminPublishEntities';

describe('Admin adminPublishEntities', () => {
  test('Minimal', async () => {
    const databaseAdapter = createMockDatabaseAdapter();
    const authorizationAdapter = createMockAuthorizationAdapter();
    const context = createMockSessionContext({ databaseAdapter });
    const now = Temporal.Now.instant();

    authorizationAdapter.resolveAuthorizationKeys.mockReturnValueOnce(
      Promise.resolve(ok({ none: 'none' }))
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
    databaseAdapter.adminEntityPublishUpdateEntity.mockResolvedValueOnce(
      Promise.resolve(ok({ updatedAt: now }))
    );
    databaseAdapter.adminEntityPublishGetUnpublishedReferencedEntities.mockResolvedValueOnce(
      Promise.resolve(ok([]))
    );
    databaseAdapter.adminEntityPublishingCreateEvents.mockResolvedValueOnce(
      Promise.resolve(ok(undefined))
    );

    const result = await adminPublishEntities(
      adminTestSchema,
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
      Array [
        Array [
          "adminEntityPublishGetUnpublishedReferencedEntities",
          Object {
            "entityInternalId": 999,
            "entityVersionInternalId": 888,
          },
        ],
        Array [
          "adminEntityPublishGetVersionInfo",
          Object {
            "id": "123",
            "version": 5,
          },
        ],
        Array [
          "adminEntityPublishUpdateEntity",
          Object {
            "entityInternalId": 999,
            "entityVersionInternalId": 888,
            "fullTextSearchText": "Title",
            "status": "published",
          },
        ],
        Array [
          "adminEntityPublishingCreateEvents",
          Object {
            "kind": "publish",
            "references": Array [
              Object {
                "entityInternalId": 999,
                "entityVersionInternalId": 888,
              },
            ],
            "session": Object {
              "subjectId": "subject-id",
              "subjectInternalId": 123,
            },
          },
        ],
        Array [
          "withRootTransaction",
        ],
      ]
    `);
  });
});
