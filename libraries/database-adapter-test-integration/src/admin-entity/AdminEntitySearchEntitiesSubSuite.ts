import type { BoundingBox } from '@jonasb/datadata-core';
import {
  AdminEntityStatus,
  AdminQueryOrder,
  copyEntity,
  getAllNodesForConnection,
} from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import { assertEquals, assertOkResult, assertResultValue, assertTruthy } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { LOCATIONS_CREATE, REFERENCES_CREATE, TITLE_ONLY_CREATE } from '../shared-entity/Fixtures';
import {
  boundingBoxBelowCenter,
  boundingBoxCenter,
  randomBoundingBox,
} from '../shared-entity/LocationTestUtils';
import {
  assertAdminEntityConnectionToMatchSlice,
  assertSearchResultEntities,
  countSearchResultStatuses,
  countSearchResultWithEntity,
} from '../shared-entity/SearchTestUtils';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

export const SearchEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  searchEntities_minimal,
  searchEntities_pagingFirst,
  searchEntities_pagingFirst0,
  searchEntities_pagingLast,
  searchEntities_pagingLast0,
  searchEntities_pagingFirstAfter,
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
  searchEntities_referenceOneReference,
  searchEntities_referenceNoReferences,
  searchEntities_referenceTwoReferencesFromOneEntity,
  searchEntities_boundingBoxOneInside,
  searchEntities_boundingBoxOneEntityTwoLocationsInside,
  searchEntities_boundingBoxOneOutside,
  searchEntities_boundingBoxWrappingMaxMinLongitude,
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

async function searchEntities_referenceOneReference({ server }: AdminEntityTestContext) {
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

  const searchResult = await adminClient.searchEntities({ referencing: titleOnlyId });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
}

async function searchEntities_referenceNoReferences({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const searchResult = await adminClient.searchEntities({ referencing: titleOnlyId });
  assertSearchResultEntities(searchResult, []);
}

async function searchEntities_referenceTwoReferencesFromOneEntity({
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

  const searchResult = await adminClient.searchEntities({ referencing: titleOnlyId });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
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
}
