import { copyEntity, PublishedEntitiesQueryOrder } from '@dossierhq/core';
import { assertOkResult, assertResultValue, assertTruthy } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdminValueItems } from '../SchemaTypes.js';
import {
  adminToPublishedEntity,
  LOCATIONS_CREATE,
  REFERENCES_CREATE,
  STRINGS_CREATE,
  TITLE_ONLY_CREATE,
  VALUE_ITEMS_CREATE,
} from '../shared-entity/Fixtures.js';
import { boundingBoxCenter, randomBoundingBox } from '../shared-entity/LocationTestUtils.js';
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

export const GetEntitiesSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  getEntities_minimal,
  getEntities_pagingFirst,
  getEntities_pagingFirst0,
  getEntities_pagingLast,
  getEntities_pagingLast0,
  getEntities_pagingFirstAfter,
  getEntities_pagingFirstAfterFirstEntity,
  getEntities_pagingFirstAfterNameWithUnicode,
  getEntities_pagingLastBefore,
  getEntities_pagingFirstBetween,
  getEntities_pagingLastBetween,
  getEntities_orderCreatedAt,
  getEntities_orderCreatedAtReversed,
  getEntities_orderName,
  getEntities_orderNameReversed,
  getEntities_authKeySubject,
  getEntities_authKeyNoneAndSubject,
  getEntities_valueTypes,
  getEntities_linksToOneReference,
  getEntities_linksToNoReferences,
  getEntities_linksToTwoReferencesFromOneEntity,
  getEntities_linksToExcludedAfterUnpublish,
  getEntities_linksToExcludedAfterUpdateWithNoReference,
  getEntities_linksToExcludedForAdminOnlyField,
  getEntities_linksFromOneReference,
  getEntities_linksFromNoReferences,
  getEntities_linksFromTwoReferencesFromOneEntity,
  getEntities_boundingBox,
  getEntities_boundingBoxExcludedWithInAdminOnlyField,
  getEntities_textIncluded,
  getEntities_textExcludedInAdminOnlyField,
];

async function getEntities_minimal({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).getEntities({
    entityTypes: ['ReadOnly'],
  });
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 25,
  });
}

async function getEntities_pagingFirst({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).getEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 10 },
  );
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, result, 0, 10);
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 10,
  });
}

async function getEntities_pagingFirst0({ server }: PublishedEntityTestContext) {
  const result = await publishedClientForMainPrincipal(server).getEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 0 },
  );
  assertResultValue(result, null);
}

async function getEntities_pagingLast({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).getEntities(
    { entityTypes: ['ReadOnly'] },
    { last: 10 },
  );
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, result, -10, undefined);
  assertPageInfoEquals(result, { hasPreviousPage: true, hasNextPage: false });
}

async function getEntities_pagingLast0({ server }: PublishedEntityTestContext) {
  const result = await publishedClientForMainPrincipal(server).getEntities(
    { entityTypes: ['ReadOnly'] },
    { last: 0 },
  );
  assertResultValue(result, null);
}

async function getEntities_pagingFirstAfter({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const client = publishedClientForMainPrincipal(server);
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const firstResult = await client.getEntities({ entityTypes: ['ReadOnly'] }, { first: 10 });
  assertOkResult(firstResult);
  const secondResult = await client.getEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 20, after: firstResult.value?.pageInfo.endCursor },
  );
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, secondResult, 10, 10 + 20);
  assertPageInfoEquals(secondResult, {
    hasPreviousPage: true,
    hasNextPage: expectedEntities.length > 10 + 20,
  });
}

async function getEntities_pagingFirstAfterFirstEntity({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const client = publishedClientForMainPrincipal(server);
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const firstResult = await client.getEntities({ entityTypes: ['ReadOnly'] }, { first: 10 });
  assertOkResult(firstResult);
  const secondResult = await client.getEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 10, after: firstResult.value?.edges[0].cursor },
  );
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, secondResult, 1, 1 + 10);
  assertPageInfoEquals(secondResult, {
    hasPreviousPage: true,
    hasNextPage: expectedEntities.length > 1 + 10,
  });
}

async function getEntities_pagingFirstAfterNameWithUnicode({
  adminSchema,
  server,
}: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  // Since the name is converted to base64 encoded cursors, use unicode in the name
  // to ensure the encode/decode is proper

  // First create two entities with unicode in the name
  const firstEntityResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Endash – and emoji 😅' } }),
    { publish: true },
  );
  const firstEntity = adminToPublishedEntity(adminSchema, firstEntityResult.valueOrThrow().entity);

  const secondEntityResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Ö, Endash – and emoji 😅' } }),
    { publish: true },
  );
  const secondEntity = adminToPublishedEntity(
    adminSchema,
    secondEntityResult.valueOrThrow().entity,
  );

  // Create entity with links to the unicode entities to create a scoped query
  const linkEntityResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, {
      fields: { anyList: [{ id: firstEntity.id }, { id: secondEntity.id }] },
    }),
    { publish: true },
  );
  const {
    entity: { id: linkId },
  } = linkEntityResult.valueOrThrow();

  // Search to get the cursor
  const firstSearchResult = await publishedClient.getEntities(
    { linksFrom: { id: linkId }, order: PublishedEntitiesQueryOrder.name },
    { first: 10 },
  );
  assertSearchResultEntities(firstSearchResult, [firstEntity, secondEntity]);
  assertPageInfoEquals(firstSearchResult, { hasPreviousPage: false, hasNextPage: false });
  assertTruthy(firstSearchResult.value);
  const {
    pageInfo: { startCursor },
  } = firstSearchResult.value;

  // Search again using the cursor
  const secondSearchResult = await publishedClient.getEntities(
    { linksFrom: { id: linkId }, order: PublishedEntitiesQueryOrder.name },
    { first: 10, after: startCursor },
  );
  assertSearchResultEntities(secondSearchResult, [secondEntity]);
  assertPageInfoEquals(secondSearchResult, { hasPreviousPage: true, hasNextPage: false });
}

async function getEntities_pagingLastBefore({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const client = publishedClientForMainPrincipal(server);
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const firstResult = await client.getEntities({ entityTypes: ['ReadOnly'] }, { last: 10 });
  assertOkResult(firstResult);
  const secondResult = await client.getEntities(
    { entityTypes: ['ReadOnly'] },
    { last: 20, before: firstResult.value?.pageInfo.startCursor },
  );
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, secondResult, -10 - 20, -10);
  assertPageInfoEquals(secondResult, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_pagingFirstBetween({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const client = publishedClientForMainPrincipal(server);
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const firstResult = await client.getEntities({ entityTypes: ['ReadOnly'] }, { first: 20 });
  assertOkResult(firstResult);
  const secondResult = await client.getEntities(
    { entityTypes: ['ReadOnly'] },
    {
      first: 20,
      after: firstResult.value?.edges[2].cursor,
      before: firstResult.value?.edges[8].cursor,
    },
  );
  assertPublishedEntityConnectionToMatchSlice(
    expectedEntities,
    secondResult,
    3 /*inclusive*/,
    8 /*exclusive*/,
  );
  // No next since we're paging forwards and there's a 'before'
  assertPageInfoEquals(secondResult, { hasPreviousPage: true, hasNextPage: false });
}

async function getEntities_pagingLastBetween({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const client = publishedClientForMainPrincipal(server);
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const firstResult = await client.getEntities({ entityTypes: ['ReadOnly'] }, { first: 20 });
  assertOkResult(firstResult);
  const secondResult = await client.getEntities(
    { entityTypes: ['ReadOnly'] },
    {
      last: 20,
      after: firstResult.value?.edges[2].cursor,
      before: firstResult.value?.edges[8].cursor,
    },
  );
  assertPublishedEntityConnectionToMatchSlice(
    expectedEntities,
    secondResult,
    3 /*inclusive*/,
    8 /*exclusive*/,
  );
  // No prev since we're paging backwards and there's a 'after'
  assertPageInfoEquals(secondResult, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_orderCreatedAt({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).getEntities({
    entityTypes: ['ReadOnly'],
    order: PublishedEntitiesQueryOrder.createdAt,
  });
  assertPublishedEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    PublishedEntitiesQueryOrder.createdAt,
  );
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 25,
  });
}

async function getEntities_orderCreatedAtReversed({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).getEntities({
    entityTypes: ['ReadOnly'],
    order: PublishedEntitiesQueryOrder.createdAt,
    reverse: true,
  });
  assertPublishedEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    PublishedEntitiesQueryOrder.createdAt,
    true,
  );
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 25,
  });
}

async function getEntities_orderName({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).getEntities({
    entityTypes: ['ReadOnly'],
    order: PublishedEntitiesQueryOrder.name,
  });
  assertPublishedEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    PublishedEntitiesQueryOrder.name,
  );
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 25,
  });
}

async function getEntities_orderNameReversed({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).getEntities({
    entityTypes: ['ReadOnly'],
    order: PublishedEntitiesQueryOrder.name,
    reverse: true,
  });
  assertPublishedEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    PublishedEntitiesQueryOrder.name,
    true,
  );
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 25,
  });
}

async function getEntities_authKeySubject({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities(['subject']);
  const result = await publishedClientForMainPrincipal(server).getEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 25,
  });
}

async function getEntities_authKeyNoneAndSubject({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities([
    'none',
    'subject',
  ]);
  const result = await publishedClientForMainPrincipal(server).getEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertPublishedEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_valueTypes({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);
  const { entity } = (
    await adminClient.createEntity(VALUE_ITEMS_CREATE, { publish: true })
  ).valueOrThrow();

  const matchesBeforeValueItem = await countSearchResultWithEntity(
    publishedClient,
    { entityTypes: ['ValueItems'], valueTypes: ['ReferencesValue'] },
    entity.id,
  );
  assertResultValue(matchesBeforeValueItem, 0);

  (
    await adminClient.updateEntity<AdminValueItems>(
      {
        id: entity.id,
        fields: { any: { type: 'ReferencesValue', reference: null } },
      },
      { publish: true },
    )
  ).throwIfError();

  const matchesAfterValueItem = await countSearchResultWithEntity(
    publishedClient,
    { entityTypes: ['ValueItems'], valueTypes: ['ReferencesValue'] },
    entity.id,
  );
  assertResultValue(matchesAfterValueItem, 1);
}

async function getEntities_linksToOneReference({
  adminSchema,
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
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleOnlyId } } }),
    { publish: true },
  );
  assertOkResult(referenceResult);
  const { entity: referenceEntity } = referenceResult.value;

  const searchResult = await publishedClient.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [adminToPublishedEntity(adminSchema, referenceEntity)]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksToNoReferences({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(titleOnlyResult);
  const {
    entity: { id },
  } = titleOnlyResult.value;

  const searchResult = await publishedClient.getEntities({ linksTo: { id } });
  assertSearchResultEntities(searchResult, []);
}

async function getEntities_linksToTwoReferencesFromOneEntity({
  adminSchema,
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
    { publish: true },
  );
  assertOkResult(referenceResult);
  const { entity: referenceEntity } = referenceResult.value;

  const searchResult = await publishedClient.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [adminToPublishedEntity(adminSchema, referenceEntity)]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksToExcludedAfterUnpublish({
  adminSchema,
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
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleOnlyId } } }),
    { publish: true },
  );
  const { entity: referenceEntity } = referenceResult.valueOrThrow();

  const searchBeforeUnpublishResult = await publishedClient.getEntities({
    linksTo: { id: titleOnlyId },
  });
  assertSearchResultEntities(searchBeforeUnpublishResult, [
    adminToPublishedEntity(adminSchema, referenceEntity),
  ]);

  assertOkResult(await adminClient.unpublishEntities([{ id: referenceEntity.id }]));

  const searchAfterUnpublishResult = await publishedClient.getEntities({
    linksTo: { id: titleOnlyId },
  });
  assertSearchResultEntities(searchAfterUnpublishResult, []);
}

async function getEntities_linksToExcludedAfterUpdateWithNoReference({
  adminSchema,
  server,
}: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceCreateResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleOnlyId } } }),
    { publish: true },
  );
  const { entity: referenceEntity } = referenceCreateResult.valueOrThrow();

  const searchBeforeUpdateResult = await publishedClient.getEntities({
    linksTo: { id: titleOnlyId },
  });
  assertSearchResultEntities(searchBeforeUpdateResult, [
    adminToPublishedEntity(adminSchema, referenceEntity),
  ]);

  assertOkResult(
    await adminClient.updateEntity(
      { id: referenceEntity.id, fields: { titleOnly: null } },
      { publish: true },
    ),
  );

  const searchAfterUpdateResult = await publishedClient.getEntities({
    linksTo: { id: titleOnlyId },
  });
  assertSearchResultEntities(searchAfterUpdateResult, []);
}

async function getEntities_linksToExcludedForAdminOnlyField({
  server,
}: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const {
    entity: { id: titleOnlyId },
  } = (await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true })).valueOrThrow();

  const referenceCreateResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { anyAdminOnly: { id: titleOnlyId } } }),
    { publish: true },
  );
  assertOkResult(referenceCreateResult);

  const searchResult = await publishedClient.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, []);
}

async function getEntities_linksFromOneReference({
  adminSchema,
  server,
}: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(titleOnlyResult);
  const { entity: titleOnlyEntity } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleOnlyEntity.id } } }),
    { publish: true },
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const searchResult = await publishedClient.getEntities({ linksFrom: { id: referenceId } });
  assertSearchResultEntities(searchResult, [adminToPublishedEntity(adminSchema, titleOnlyEntity)]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksFromNoReferences({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const referenceResult = await adminClient.createEntity(REFERENCES_CREATE, { publish: true });
  assertOkResult(referenceResult);
  const {
    entity: { id },
  } = referenceResult.value;

  const searchResult = await publishedClient.getEntities({ linksFrom: { id } });
  assertSearchResultEntities(searchResult, []);
}

async function getEntities_linksFromTwoReferencesFromOneEntity({
  adminSchema,
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
    { publish: true },
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const searchResult = await publishedClient.getEntities({ linksFrom: { id: referenceId } });
  assertSearchResultEntities(searchResult, [adminToPublishedEntity(adminSchema, titleOnlyEntity)]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_boundingBox({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const boundingBox = randomBoundingBox();
  const center = boundingBoxCenter(boundingBox);
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: center } }),
    { publish: true },
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(publishedClient, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function getEntities_boundingBoxExcludedWithInAdminOnlyField({
  server,
}: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const boundingBox = randomBoundingBox();
  const center = boundingBoxCenter(boundingBox);
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { locationAdminOnly: center } }),
    { publish: true },
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(publishedClient, { boundingBox }, id);
  assertResultValue(matches, 0);
}

async function getEntities_textIncluded({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const createResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      fields: { title: 'winter is coming' },
    }),
    { publish: true },
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(publishedClient, { text: 'winter' }, id);
  assertResultValue(matches, 1);
}

async function getEntities_textExcludedInAdminOnlyField({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const createResult = await adminClient.createEntity(
    copyEntity(STRINGS_CREATE, {
      fields: { stringAdminOnly: 'papaya, coconut, and all those things' },
    }),
    { publish: true },
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(publishedClient, { text: 'coconut' }, id);
  assertResultValue(matches, 0);
}
