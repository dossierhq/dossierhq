import { copyEntity, PublishedQueryOrder } from '@jonasb/datadata-core';
import { assertOkResult, assertResultValue, assertTruthy } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  adminToPublishedEntity,
  REFERENCES_CREATE,
  STRINGS_CREATE,
  TITLE_ONLY_CREATE,
} from '../shared-entity/Fixtures.js';
import {
  assertPageInfoEquals,
  assertPublishedEntityConnectionToMatchSlice,
  assertSearchResultEntities,
  countSearchResultWithEntity,
} from '../shared-entity/SearchTestUtils.js';
import {
  adminClientForMainPrincipal,
  publishedClientForMainPrincipal,
} from '../shared-entity/TestClients.js';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite.js';

export const SearchEntitiesSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  searchEntities_minimal,
  searchEntities_pagingFirst,
  searchEntities_pagingFirst0,
  searchEntities_pagingLast,
  searchEntities_pagingLast0,
  searchEntities_pagingFirstAfter,
  searchEntities_pagingFirstAfterFirstEntity,
  searchEntities_pagingFirstAfterNameWithUnicode,
  searchEntities_pagingLastBefore,
  searchEntities_pagingFirstBetween,
  searchEntities_pagingLastBetween,
  searchEntities_orderCreatedAt,
  searchEntities_orderCreatedAtReversed,
  searchEntities_orderName,
  searchEntities_orderNameReversed,
  searchEntities_authKeySubject,
  searchEntities_authKeyNoneAndSubject,
  searchEntities_linksToOneReference,
  searchEntities_linksToNoReferences,
  searchEntities_linksToTwoReferencesFromOneEntity,
  searchEntities_linksFromOneReference,
  searchEntities_linksFromNoReferences,
  searchEntities_linksFromTwoReferencesFromOneEntity,
  searchEntities_textIncluded,
  searchEntities_textExcludedInAdminOnlyField,
];

async function searchEntities_minimal({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
  });
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 25,
  });
}

async function searchEntities_pagingFirst({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 10 }
  );
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, result, 0, 10);
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 10,
  });
}

async function searchEntities_pagingFirst0({ server }: PublishedEntityTestContext) {
  const result = await publishedClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 0 }
  );
  assertResultValue(result, null);
}

async function searchEntities_pagingLast({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { last: 10 }
  );
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, result, -10, undefined);
  assertPageInfoEquals(result, { hasPreviousPage: true, hasNextPage: false });
}

async function searchEntities_pagingLast0({ server }: PublishedEntityTestContext) {
  const result = await publishedClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { last: 0 }
  );
  assertResultValue(result, null);
}

async function searchEntities_pagingFirstAfter({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const client = publishedClientForMainPrincipal(server);
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const firstResult = await client.searchEntities({ entityTypes: ['ReadOnly'] }, { first: 10 });
  assertOkResult(firstResult);
  const secondResult = await client.searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 20, after: firstResult.value?.pageInfo.endCursor }
  );
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, secondResult, 10, 10 + 20);
  assertPageInfoEquals(secondResult, {
    hasPreviousPage: true,
    hasNextPage: expectedEntities.length > 10 + 20,
  });
}

async function searchEntities_pagingFirstAfterFirstEntity({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const client = publishedClientForMainPrincipal(server);
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const firstResult = await client.searchEntities({ entityTypes: ['ReadOnly'] }, { first: 10 });
  assertOkResult(firstResult);
  const secondResult = await client.searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 10, after: firstResult.value?.edges[0].cursor }
  );
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, secondResult, 1, 1 + 10);
  assertPageInfoEquals(secondResult, {
    hasPreviousPage: true,
    hasNextPage: expectedEntities.length > 1 + 10,
  });
}

async function searchEntities_pagingFirstAfterNameWithUnicode({
  server,
}: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  // Since the name is converted to base64 encoded cursors, use unicode in the name
  // to ensure the encode/decode is proper

  // First create two entities with unicode in the name
  const firstEntityResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Endash – and emoji 😅' } }),
    { publish: true }
  );
  const firstEntity = adminToPublishedEntity(firstEntityResult.valueOrThrow().entity);

  const secondEntityResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Ö, Endash – and emoji 😅' } }),
    { publish: true }
  );
  const secondEntity = adminToPublishedEntity(secondEntityResult.valueOrThrow().entity);

  // Create entity with links to the unicode entities to create a scoped query
  const linkEntityResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, {
      fields: { anyList: [{ id: firstEntity.id }, { id: secondEntity.id }] },
    }),
    { publish: true }
  );
  const {
    entity: { id: linkId },
  } = linkEntityResult.valueOrThrow();

  // Search to get the cursor
  const firstSearchResult = await publishedClient.searchEntities(
    { linksFrom: { id: linkId }, order: PublishedQueryOrder.name },
    { first: 10 }
  );
  assertSearchResultEntities(firstSearchResult, [firstEntity, secondEntity]);
  assertPageInfoEquals(firstSearchResult, { hasPreviousPage: false, hasNextPage: false });
  assertTruthy(firstSearchResult.value);
  const {
    pageInfo: { startCursor },
  } = firstSearchResult.value;

  // Search again using the cursor
  const secondSearchResult = await publishedClient.searchEntities(
    { linksFrom: { id: linkId }, order: PublishedQueryOrder.name },
    { first: 10, after: startCursor }
  );
  assertSearchResultEntities(secondSearchResult, [secondEntity]);
  assertPageInfoEquals(secondSearchResult, { hasPreviousPage: true, hasNextPage: false });
}

async function searchEntities_pagingLastBefore({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const client = publishedClientForMainPrincipal(server);
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const firstResult = await client.searchEntities({ entityTypes: ['ReadOnly'] }, { last: 10 });
  assertOkResult(firstResult);
  const secondResult = await client.searchEntities(
    { entityTypes: ['ReadOnly'] },
    { last: 20, before: firstResult.value?.pageInfo.startCursor }
  );
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, secondResult, -10 - 20, -10);
  assertPageInfoEquals(secondResult, { hasPreviousPage: false, hasNextPage: true });
}

async function searchEntities_pagingFirstBetween({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const client = publishedClientForMainPrincipal(server);
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
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
  assertPublishedEntityConnectionToMatchSlice(
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
}: PublishedEntityTestContext) {
  const client = publishedClientForMainPrincipal(server);
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
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
  assertPublishedEntityConnectionToMatchSlice(
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
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    order: PublishedQueryOrder.createdAt,
  });
  assertPublishedEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    PublishedQueryOrder.createdAt
  );
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 25,
  });
}

async function searchEntities_orderCreatedAtReversed({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    order: PublishedQueryOrder.createdAt,
    reverse: true,
  });
  assertPublishedEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    PublishedQueryOrder.createdAt,
    true
  );
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 25,
  });
}

async function searchEntities_orderName({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    order: PublishedQueryOrder.name,
  });
  assertPublishedEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    PublishedQueryOrder.name
  );
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 25,
  });
}

async function searchEntities_orderNameReversed({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    order: PublishedQueryOrder.name,
    reverse: true,
  });
  assertPublishedEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    PublishedQueryOrder.name,
    true
  );
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 25,
  });
}

async function searchEntities_authKeySubject({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities(['subject']);
  const result = await publishedClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 25,
  });
}

async function searchEntities_authKeyNoneAndSubject({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities([
    'none',
    'subject',
  ]);
  const result = await publishedClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function searchEntities_linksToOneReference({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleOnlyId } } }),
    { publish: true }
  );
  assertOkResult(referenceResult);
  const { entity: referenceEntity } = referenceResult.value;

  const searchResult = await publishedClient.searchEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [adminToPublishedEntity(referenceEntity)]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function searchEntities_linksToNoReferences({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(titleOnlyResult);
  const {
    entity: { id },
  } = titleOnlyResult.value;

  const searchResult = await publishedClient.searchEntities({ linksTo: { id } });
  assertSearchResultEntities(searchResult, []);
}

async function searchEntities_linksToTwoReferencesFromOneEntity({
  server,
}: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, {
      fields: { any: { id: titleOnlyId }, titleOnly: { id: titleOnlyId } },
    }),
    { publish: true }
  );
  assertOkResult(referenceResult);
  const { entity: referenceEntity } = referenceResult.value;

  const searchResult = await publishedClient.searchEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [adminToPublishedEntity(referenceEntity)]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function searchEntities_linksFromOneReference({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(titleOnlyResult);
  const { entity: titleOnlyEntity } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleOnlyEntity.id } } }),
    { publish: true }
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const searchResult = await publishedClient.searchEntities({ linksFrom: { id: referenceId } });
  assertSearchResultEntities(searchResult, [adminToPublishedEntity(titleOnlyEntity)]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function searchEntities_linksFromNoReferences({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const referenceResult = await adminClient.createEntity(REFERENCES_CREATE, { publish: true });
  assertOkResult(referenceResult);
  const {
    entity: { id },
  } = referenceResult.value;

  const searchResult = await publishedClient.searchEntities({ linksFrom: { id } });
  assertSearchResultEntities(searchResult, []);
}

async function searchEntities_linksFromTwoReferencesFromOneEntity({
  server,
}: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(titleOnlyResult);
  const { entity: titleOnlyEntity } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, {
      fields: { any: { id: titleOnlyEntity.id }, titleOnly: { id: titleOnlyEntity.id } },
    }),
    { publish: true }
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const searchResult = await publishedClient.searchEntities({ linksFrom: { id: referenceId } });
  assertSearchResultEntities(searchResult, [adminToPublishedEntity(titleOnlyEntity)]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function searchEntities_textIncluded({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const createResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      fields: { title: 'winter is coming' },
    }),
    { publish: true }
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(publishedClient, { text: 'winter' }, id);
  assertResultValue(matches, 1);
}

async function searchEntities_textExcludedInAdminOnlyField({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const createResult = await adminClient.createEntity(
    copyEntity(STRINGS_CREATE, {
      fields: { stringAdminOnly: 'papaya, coconut, and all those things' },
    }),
    { publish: true }
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(publishedClient, { text: 'coconut' }, id);
  assertResultValue(matches, 0);
}
