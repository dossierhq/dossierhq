import type { BoundingBox } from '@jonasb/datadata-core';
import {
  AdminEntityStatus,
  AdminQueryOrder,
  copyEntity,
  createRichTextEntityNode,
  createRichTextRootNode,
  createRichTextValueItemNode,
  getAllNodesForConnection,
} from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import { assertEquals, assertOkResult, assertResultValue, assertTruthy } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdminLocationsValue, AdminReferencesValue } from '../SchemaTypes.js';
import {
  LOCATIONS_CREATE,
  REFERENCES_CREATE,
  RICH_TEXTS_CREATE,
  TITLE_ONLY_CREATE,
} from '../shared-entity/Fixtures.js';
import {
  boundingBoxBelowCenter,
  boundingBoxCenter,
  randomBoundingBox,
} from '../shared-entity/LocationTestUtils.js';
import {
  assertAdminEntityConnectionToMatchSlice,
  assertPageInfoEquals,
  assertSearchResultEntities,
  countSearchResultStatuses,
  countSearchResultWithEntity,
} from '../shared-entity/SearchTestUtils.js';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const SearchEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  searchEntities_minimal,
  searchEntities_pagingFirst,
  searchEntities_pagingFirst0,
  searchEntities_pagingLast,
  searchEntities_pagingLast0,
  searchEntities_pagingFirstAfter,
  searchEntities_pagingFirstAfterNameWithUnicode,
  searchEntities_pagingLastBefore,
  searchEntities_pagingFirstBetween,
  searchEntities_pagingLastBetween,
  searchEntities_orderCreatedAt,
  searchEntities_orderCreatedAtReversed,
  searchEntities_orderUpdatedAt,
  searchEntities_orderUpdatedAtReversed,
  searchEntities_orderName,
  searchEntities_orderNameReversed,
  searchEntities_statusDraft,
  searchEntities_statusPublished,
  searchEntities_statusModified,
  searchEntities_statusWithdrawn,
  searchEntities_statusArchived,
  searchEntities_statusDraftArchived,
  searchEntities_statusModifiedPublished,
  searchEntities_statusAll,
  searchEntities_linksToOneReference,
  searchEntities_linksToOneReferenceFromRichText,
  searchEntities_linksToOneReferenceFromValueItemInRichText,
  searchEntities_linksToNoReferences,
  searchEntities_linksToTwoReferencesFromOneEntity,
  searchEntities_linksFromOneReference,
  searchEntities_linksFromNoReferences,
  searchEntities_linksFromTwoReferencesFromOneEntity,
  searchEntities_boundingBoxOneInside,
  searchEntities_boundingBoxOneInsideFromValueItemInRichText,
  searchEntities_boundingBoxOneEntityTwoLocationsInside,
  searchEntities_boundingBoxOneOutside,
  searchEntities_boundingBoxWrappingMaxMinLongitude,
  searchEntities_textIncludedAfterCreation,
  searchEntities_textIncludedAfterUpdate,
  searchEntities_textExcludedAfterUpdate,
  searchEntities_authKeySubject,
  searchEntities_authKeyNoneAndSubject,
];

async function searchEntities_minimal({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
  });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function searchEntities_pagingFirst({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 10 }
  );
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 10);
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function searchEntities_pagingFirst0({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 0 }
  );
  assertResultValue(result, null);
}

async function searchEntities_pagingLast({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { last: 10 }
  );
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, -10, undefined);
  assertPageInfoEquals(result, { hasPreviousPage: true, hasNextPage: false });
}

async function searchEntities_pagingLast0({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { last: 0 }
  );
  assertResultValue(result, null);
}

async function searchEntities_pagingFirstAfter({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const firstResult = await client.searchEntities({ entityTypes: ['ReadOnly'] }, { first: 10 });
  assertOkResult(firstResult);
  const secondResult = await client.searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 20, after: firstResult.value?.pageInfo.endCursor }
  );
  assertAdminEntityConnectionToMatchSlice(expectedEntities, secondResult, 10, 10 + 20);
  assertPageInfoEquals(secondResult, { hasPreviousPage: true, hasNextPage: true });
}

async function searchEntities_pagingFirstAfterNameWithUnicode({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);

  // Since the name is converted to base64 encoded cursors, use unicode in the name
  // to ensure the encode/decode is proper

  // First create two entities with unicode in the name
  const firstEntityResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Endash – and emoji 😅' } })
  );
  const { entity: firstEntity } = firstEntityResult.valueOrThrow();

  const secondEntityResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Ö, Endash – and emoji 😅' } })
  );
  const { entity: secondEntity } = secondEntityResult.valueOrThrow();

  // Create entity with links to the unicode entities to create a scoped query
  const linkEntityResult = await client.createEntity(
    copyEntity(REFERENCES_CREATE, {
      fields: { anyList: [{ id: firstEntity.id }, { id: secondEntity.id }] },
    })
  );
  const {
    entity: { id: linkId },
  } = linkEntityResult.valueOrThrow();

  // Search to get the cursor
  const firstSearchResult = await client.searchEntities(
    { linksFrom: { id: linkId }, order: AdminQueryOrder.name },
    { first: 10 }
  );
  assertSearchResultEntities(firstSearchResult, [firstEntity, secondEntity]);
  assertPageInfoEquals(firstSearchResult, { hasPreviousPage: false, hasNextPage: false });
  assertTruthy(firstSearchResult.value);
  const {
    pageInfo: { startCursor },
  } = firstSearchResult.value;

  // Search again using the cursor
  const secondSearchResult = await client.searchEntities(
    { linksFrom: { id: linkId }, order: AdminQueryOrder.name },
    { first: 10, after: startCursor }
  );
  assertSearchResultEntities(secondSearchResult, [secondEntity]);
  assertPageInfoEquals(secondSearchResult, { hasPreviousPage: true, hasNextPage: false });
}

async function searchEntities_pagingLastBefore({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const firstResult = await client.searchEntities({ entityTypes: ['ReadOnly'] }, { last: 10 });
  assertOkResult(firstResult);
  const secondResult = await client.searchEntities(
    { entityTypes: ['ReadOnly'] },
    { last: 20, before: firstResult.value?.pageInfo.startCursor }
  );
  assertAdminEntityConnectionToMatchSlice(expectedEntities, secondResult, -10 - 20, -10);
  assertPageInfoEquals(secondResult, { hasPreviousPage: true, hasNextPage: true });
}

async function searchEntities_pagingFirstBetween({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const firstResult = await client.searchEntities({ entityTypes: ['ReadOnly'] }, { first: 20 });
  assertOkResult(firstResult);
  const secondResult = await client.searchEntities(
    { entityTypes: ['ReadOnly'] },
    {
      first: 20,
      after: firstResult.value?.edges[2].cursor,
      before: firstResult.value?.edges[8].cursor,
    }
  );
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    secondResult,
    3 /*inclusive*/,
    8 /*exclusive*/
  );
  // No next since we're paging forwards and there's a 'before'
  assertPageInfoEquals(secondResult, { hasPreviousPage: true, hasNextPage: false });
}

async function searchEntities_pagingLastBetween({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const firstResult = await client.searchEntities({ entityTypes: ['ReadOnly'] }, { first: 20 });
  assertOkResult(firstResult);
  const secondResult = await client.searchEntities(
    { entityTypes: ['ReadOnly'] },
    {
      last: 20,
      after: firstResult.value?.edges[2].cursor,
      before: firstResult.value?.edges[8].cursor,
    }
  );
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    secondResult,
    3 /*inclusive*/,
    8 /*exclusive*/
  );
  // No prev since we're paging backwards and there's a 'after'
  assertPageInfoEquals(secondResult, { hasPreviousPage: false, hasNextPage: true });
}

async function searchEntities_orderCreatedAt({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    order: AdminQueryOrder.createdAt,
  });
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    AdminQueryOrder.createdAt
  );
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function searchEntities_orderCreatedAtReversed({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    order: AdminQueryOrder.createdAt,
    reverse: true,
  });
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    AdminQueryOrder.createdAt,
    true
  );
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function searchEntities_orderUpdatedAt({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();

  // The postgres backend sometimes `updated` that's slightly off from `updated_at`. I believe it's
  // due to NOW() being fixed by transaction.
  // Check that all updatedAt are after the previous updatedAt, with a small adjustment.

  let count = 0;
  let previousUpdatedAt: Temporal.Instant | null = null;

  const adminClient = adminClientForMainPrincipal(server);
  for await (const node of getAllNodesForConnection({ first: 50 }, (currentPaging) =>
    adminClient.searchEntities(
      { entityTypes: ['ReadOnly'], order: AdminQueryOrder.updatedAt },
      currentPaging
    )
  )) {
    assertOkResult(node);
    count++;
    const {
      info: { updatedAt },
    } = node.value;
    if (previousUpdatedAt) {
      const adjustedUpdatedAt = updatedAt.add({ milliseconds: 20 });
      assertTruthy(Temporal.Instant.compare(previousUpdatedAt, adjustedUpdatedAt) < 0);
    }
    previousUpdatedAt = updatedAt;
  }

  assertEquals(count, expectedEntities.length);
}

async function searchEntities_orderUpdatedAtReversed({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();

  // The postgres backend sometimes `updated` that's slightly off from `updated_at`. I believe it's
  // due to NOW() being fixed by transaction.
  // Check that all updatedAt are before the previous updatedAt, with a small adjustment.

  let count = 0;
  let previousUpdatedAt: Temporal.Instant | null = null;

  const adminClient = adminClientForMainPrincipal(server);
  for await (const node of getAllNodesForConnection({ first: 50 }, (currentPaging) =>
    adminClient.searchEntities(
      { entityTypes: ['ReadOnly'], order: AdminQueryOrder.updatedAt, reverse: true },
      currentPaging
    )
  )) {
    assertOkResult(node);
    count++;
    const {
      info: { updatedAt },
    } = node.value;
    if (previousUpdatedAt) {
      const adjustedUpdatedAt = updatedAt.subtract({ milliseconds: 20 });
      assertTruthy(Temporal.Instant.compare(previousUpdatedAt, adjustedUpdatedAt) > 0);
    }
    previousUpdatedAt = updatedAt;
  }

  assertEquals(count, expectedEntities.length);
}

async function searchEntities_orderName({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    order: AdminQueryOrder.name,
  });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 25, AdminQueryOrder.name);
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function searchEntities_orderNameReversed({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    order: AdminQueryOrder.name,
    reverse: true,
  });
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    AdminQueryOrder.name,
    true
  );
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function searchEntities_statusDraft({ server }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(adminClientForMainPrincipal(server), {
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.draft],
  });
  assertOkResult(statusesResult);
  const { [AdminEntityStatus.draft]: draft, ...otherStatuses } = statusesResult.value;
  assertTruthy(draft > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    [AdminEntityStatus.archived]: 0,
  });
}

async function searchEntities_statusPublished({ server }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(adminClientForMainPrincipal(server), {
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.published],
  });
  assertOkResult(statusesResult);
  const { [AdminEntityStatus.published]: published, ...otherStatuses } = statusesResult.value;
  assertTruthy(published > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    [AdminEntityStatus.archived]: 0,
  });
}

async function searchEntities_statusModified({ server }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(adminClientForMainPrincipal(server), {
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.modified],
  });
  assertOkResult(statusesResult);
  const { [AdminEntityStatus.modified]: modified, ...otherStatuses } = statusesResult.value;
  assertTruthy(modified > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    [AdminEntityStatus.archived]: 0,
  });
}

async function searchEntities_statusWithdrawn({ server }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(adminClientForMainPrincipal(server), {
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.withdrawn],
  });
  assertOkResult(statusesResult);
  const { [AdminEntityStatus.withdrawn]: withdrawn, ...otherStatuses } = statusesResult.value;
  assertTruthy(withdrawn > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.archived]: 0,
  });
}

async function searchEntities_statusArchived({ server }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(adminClientForMainPrincipal(server), {
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.archived],
  });
  assertOkResult(statusesResult);
  const { [AdminEntityStatus.archived]: archived, ...otherStatuses } = statusesResult.value;
  assertTruthy(archived > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.withdrawn]: 0,
  });
}

async function searchEntities_statusDraftArchived({ server }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(adminClientForMainPrincipal(server), {
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.draft, AdminEntityStatus.archived],
  });
  assertOkResult(statusesResult);
  const {
    [AdminEntityStatus.draft]: draft,
    [AdminEntityStatus.archived]: archived,
    ...otherStatuses
  } = statusesResult.value;
  assertTruthy(draft > 0);
  assertTruthy(archived > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.withdrawn]: 0,
  });
}

async function searchEntities_statusModifiedPublished({ server }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(adminClientForMainPrincipal(server), {
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.modified, AdminEntityStatus.published],
  });
  assertOkResult(statusesResult);
  const {
    [AdminEntityStatus.modified]: modified,
    [AdminEntityStatus.published]: published,
    ...otherStatuses
  } = statusesResult.value;
  assertTruthy(modified > 0);
  assertTruthy(published > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    [AdminEntityStatus.archived]: 0,
  });
}

async function searchEntities_statusAll({ server }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(adminClientForMainPrincipal(server), {
    entityTypes: ['ReadOnly'],
    status: [
      AdminEntityStatus.draft,
      AdminEntityStatus.published,
      AdminEntityStatus.modified,
      AdminEntityStatus.archived,
      AdminEntityStatus.withdrawn,
    ],
  });
  assertOkResult(statusesResult);
  const {
    [AdminEntityStatus.draft]: draft,
    [AdminEntityStatus.archived]: archived,
    [AdminEntityStatus.published]: published,
    [AdminEntityStatus.modified]: modified,
    [AdminEntityStatus.withdrawn]: withdrawn,
  } = statusesResult.value;
  assertTruthy(draft > 0);
  assertTruthy(archived > 0);
  assertTruthy(published > 0);
  assertTruthy(modified > 0);
  assertTruthy(withdrawn > 0);
}

async function searchEntities_linksToOneReference({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleOnlyId } } })
  );
  assertOkResult(referenceResult);

  const searchResult = await adminClient.searchEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function searchEntities_linksToOneReferenceFromRichText({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(RICH_TEXTS_CREATE, {
      fields: { richText: createRichTextRootNode([createRichTextEntityNode({ id: titleOnlyId })]) },
    })
  );
  assertOkResult(referenceResult);

  const searchResult = await adminClient.searchEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function searchEntities_linksToOneReferenceFromValueItemInRichText({
  server,
}: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(RICH_TEXTS_CREATE, {
      fields: {
        richText: createRichTextRootNode([
          createRichTextValueItemNode<AdminReferencesValue>({
            type: 'ReferencesValue',
            reference: { id: titleOnlyId },
          }),
        ]),
      },
    })
  );
  assertOkResult(referenceResult);

  const searchResult = await adminClient.searchEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function searchEntities_linksToNoReferences({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const searchResult = await adminClient.searchEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, []);
}

async function searchEntities_linksToTwoReferencesFromOneEntity({
  server,
}: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, {
      fields: { any: { id: titleOnlyId }, titleOnly: { id: titleOnlyId } },
    })
  );
  assertOkResult(referenceResult);

  const searchResult = await adminClient.searchEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function searchEntities_linksFromOneReference({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const { entity: titleOnlyEntity } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleOnlyEntity.id } } })
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const searchResult = await adminClient.searchEntities({ linksFrom: { id: referenceId } });
  assertSearchResultEntities(searchResult, [titleOnlyEntity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function searchEntities_linksFromNoReferences({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const referenceResult = await adminClient.createEntity(REFERENCES_CREATE);
  assertOkResult(referenceResult);
  const {
    entity: { id },
  } = referenceResult.value;

  const searchResult = await adminClient.searchEntities({ linksFrom: { id } });
  assertSearchResultEntities(searchResult, []);
}

async function searchEntities_linksFromTwoReferencesFromOneEntity({
  server,
}: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const { entity: titleOnlyEntity } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, {
      fields: { any: { id: titleOnlyEntity.id }, titleOnly: { id: titleOnlyEntity.id } },
    })
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const searchResult = await adminClient.searchEntities({ linksFrom: { id: referenceId } });
  assertSearchResultEntities(searchResult, [titleOnlyEntity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function searchEntities_boundingBoxOneInside({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const boundingBox = randomBoundingBox();
  const center = boundingBoxCenter(boundingBox);
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: center } })
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(adminClient, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function searchEntities_boundingBoxOneInsideFromValueItemInRichText({
  server,
}: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const boundingBox = randomBoundingBox();
  const center = boundingBoxCenter(boundingBox);
  const createResult = await adminClient.createEntity(
    copyEntity(RICH_TEXTS_CREATE, {
      fields: {
        richText: createRichTextRootNode([
          createRichTextValueItemNode<AdminLocationsValue>({
            type: 'LocationsValue',
            location: center,
          }),
        ]),
      },
    })
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(adminClient, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function searchEntities_boundingBoxOneEntityTwoLocationsInside({
  server,
}: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const boundingBox = randomBoundingBox();
  const center = boundingBoxCenter(boundingBox);
  const inside = boundingBoxBelowCenter(boundingBox);
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: center, locationList: [inside] } })
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(adminClient, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function searchEntities_boundingBoxOneOutside({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const boundingBox = randomBoundingBox();
  const outside = {
    lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
    lng: boundingBox.minLng > 0 ? boundingBox.minLng - 1 : boundingBox.maxLng + 1,
  };
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: outside } })
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(adminClient, { boundingBox }, id);
  assertResultValue(matches, 0);
}

async function searchEntities_boundingBoxWrappingMaxMinLongitude({
  server,
}: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const boundingBox: BoundingBox = { minLat: -50, maxLat: -49, minLng: 179, maxLng: -179 };
  const center = boundingBoxCenter(boundingBox);
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: center } })
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(adminClient, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function searchEntities_authKeySubject({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities(['subject']);
  const result = await adminClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 25,
  });
}

async function searchEntities_textIncludedAfterCreation({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const createResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      fields: { title: 'this is a serious title with the best insights' },
    })
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(adminClient, { text: 'serious insights' }, id);
  assertResultValue(matches, 1);
}

async function searchEntities_textIncludedAfterUpdate({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matchesBeforeUpdate = await countSearchResultWithEntity(
    adminClient,
    { text: 'fox jumping' },
    id
  );
  assertResultValue(matchesBeforeUpdate, 0);

  const updateResult = await adminClient.updateEntity({
    id,
    fields: { title: "who's jumping? It it the fox" },
  });
  assertOkResult(updateResult);

  const matchesAfterUpdate = await countSearchResultWithEntity(
    adminClient,
    { text: 'fox jumping' },
    id
  );
  assertResultValue(matchesAfterUpdate, 1);
}

async function searchEntities_textExcludedAfterUpdate({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const createResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { fields: { title: "who's jumping? It it the fox" } })
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matchesBeforeUpdate = await countSearchResultWithEntity(
    adminClient,
    { text: 'fox jumping' },
    id
  );
  assertResultValue(matchesBeforeUpdate, 1);

  const updateResult = await adminClient.updateEntity({
    id,
    fields: { title: 'Random title' },
  });
  assertOkResult(updateResult);

  const matchesAfterUpdate = await countSearchResultWithEntity(
    adminClient,
    { text: 'fox jumping' },
    id
  );
  assertResultValue(matchesAfterUpdate, 0);
}

async function searchEntities_authKeyNoneAndSubject({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities([
    'none',
    'subject',
  ]);
  const result = await adminClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}
