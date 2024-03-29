import {
  AdminEntityQueryOrder,
  AdminEntityStatus,
  copyEntity,
  createRichText,
  createRichTextComponentNode,
  createRichTextEntityLinkNode,
  createRichTextEntityNode,
  createRichTextParagraphNode,
  createRichTextTextNode,
  getAllNodesForConnection,
  type BoundingBox,
} from '@dossierhq/core';
import { assertEquals, assertOkResult, assertResultValue, assertTruthy } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type {
  AdminComponents,
  AdminLocationsComponent,
  AdminReferencesComponent,
} from '../SchemaTypes.js';
import {
  CHANGE_VALIDATIONS_CREATE,
  LOCATIONS_CREATE,
  REFERENCES_CREATE,
  RICH_TEXTS_CREATE,
  STRINGS_CREATE,
  TITLE_ONLY_CREATE,
  VALUE_ITEMS_CREATE,
} from '../shared-entity/Fixtures.js';
import { createInvalidEntity } from '../shared-entity/InvalidEntityUtils.js';
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
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const GetEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getEntities_minimal,
  getEntities_pagingFirst,
  getEntities_pagingFirst0,
  getEntities_pagingLast,
  getEntities_pagingLast0,
  getEntities_pagingFirstAfter,
  getEntities_pagingFirstAfterNameWithUnicode,
  getEntities_pagingLastBefore,
  getEntities_pagingFirstBetween,
  getEntities_pagingLastBetween,
  getEntities_orderCreatedAt,
  getEntities_orderCreatedAtReversed,
  getEntities_orderUpdatedAt,
  getEntities_orderUpdatedAtReversed,
  getEntities_orderName,
  getEntities_orderNameReversed,
  getEntities_statusDraft,
  getEntities_statusPublished,
  getEntities_statusModified,
  getEntities_statusWithdrawn,
  getEntities_statusArchived,
  getEntities_statusDraftArchived,
  getEntities_statusModifiedPublished,
  getEntities_statusAll,
  getEntities_invalidOnly,
  getEntities_validOnly,
  getEntities_componentTypes,
  getEntities_linksToOneReference,
  getEntities_linksToOneReferenceFromRichText,
  getEntities_linksToOneReferenceFromLinkRichText,
  getEntities_linksToOneReferenceFromComponentInRichText,
  getEntities_linksToFromAdminOnlyField,
  getEntities_linksToNoReferences,
  getEntities_linksToTwoReferencesFromOneEntity,
  getEntities_linksFromOneReference,
  getEntities_linksFromNoReferences,
  getEntities_linksFromTwoReferencesFromOneEntity,
  getEntities_boundingBoxOneInside,
  getEntities_boundingBoxOneInsideFromComponentInRichText,
  getEntities_boundingBoxOneEntityTwoLocationsInside,
  getEntities_boundingBoxOneInsideFromAdminOnlyField,
  getEntities_boundingBoxOneOutside,
  getEntities_boundingBoxWrappingMaxMinLongitude,
  getEntities_textIncludedAfterCreation,
  getEntities_textIncludedInAdminOnlyFieldAfterCreation,
  getEntities_textIncludedAfterUpdate,
  getEntities_textExcludedAfterUpdate,
  getEntities_authKeySubject,
  getEntities_authKeySubjectFromReadonlyRandom,
  getEntities_authKeyNoneAndSubject,
];

async function getEntities_minimal({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await clientProvider.adminClient().getEntities({
    entityTypes: ['ReadOnly'],
  });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_pagingFirst({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await clientProvider
    .adminClient()
    .getEntities({ entityTypes: ['ReadOnly'] }, { first: 10 });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 10);
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_pagingFirst0({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider
    .adminClient()
    .getEntities({ entityTypes: ['ReadOnly'] }, { first: 0 });
  assertResultValue(result, null);
}

async function getEntities_pagingLast({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await clientProvider
    .adminClient()
    .getEntities({ entityTypes: ['ReadOnly'] }, { last: 10 });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, -10, undefined);
  assertPageInfoEquals(result, { hasPreviousPage: true, hasNextPage: false });
}

async function getEntities_pagingLast0({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider
    .adminClient()
    .getEntities({ entityTypes: ['ReadOnly'] }, { last: 0 });
  assertResultValue(result, null);
}

async function getEntities_pagingFirstAfter({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const firstResult = await client.getEntities({ entityTypes: ['ReadOnly'] }, { first: 10 });
  assertOkResult(firstResult);
  const secondResult = await client.getEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 20, after: firstResult.value?.pageInfo.endCursor },
  );
  assertAdminEntityConnectionToMatchSlice(expectedEntities, secondResult, 10, 10 + 20);
  assertPageInfoEquals(secondResult, { hasPreviousPage: true, hasNextPage: true });
}

async function getEntities_pagingFirstAfterNameWithUnicode({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();

  // Since the name is converted to base64 encoded cursors, use unicode in the name
  // to ensure the encode/decode is proper

  // First create two entities with unicode in the name
  const firstEntityResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Endash – and emoji 😅' } }),
  );
  const { entity: firstEntity } = firstEntityResult.valueOrThrow();

  const secondEntityResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Ö, Endash – and emoji 😅' } }),
  );
  const { entity: secondEntity } = secondEntityResult.valueOrThrow();

  // Create entity with links to the unicode entities to create a scoped query
  const linkEntityResult = await client.createEntity(
    copyEntity(REFERENCES_CREATE, {
      fields: { anyList: [{ id: firstEntity.id }, { id: secondEntity.id }] },
    }),
  );
  const {
    entity: { id: linkId },
  } = linkEntityResult.valueOrThrow();

  // Search to get the cursor
  const firstSearchResult = await client.getEntities(
    { linksFrom: { id: linkId }, order: AdminEntityQueryOrder.name },
    { first: 10 },
  );
  assertSearchResultEntities(firstSearchResult, [firstEntity, secondEntity]);
  assertPageInfoEquals(firstSearchResult, { hasPreviousPage: false, hasNextPage: false });
  assertTruthy(firstSearchResult.value);
  const {
    pageInfo: { startCursor },
  } = firstSearchResult.value;

  // Search again using the cursor
  const secondSearchResult = await client.getEntities(
    { linksFrom: { id: linkId }, order: AdminEntityQueryOrder.name },
    { first: 10, after: startCursor },
  );
  assertSearchResultEntities(secondSearchResult, [secondEntity]);
  assertPageInfoEquals(secondSearchResult, { hasPreviousPage: true, hasNextPage: false });
}

async function getEntities_pagingLastBefore({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const firstResult = await client.getEntities({ entityTypes: ['ReadOnly'] }, { last: 10 });
  assertOkResult(firstResult);
  const secondResult = await client.getEntities(
    { entityTypes: ['ReadOnly'] },
    { last: 20, before: firstResult.value?.pageInfo.startCursor },
  );
  assertAdminEntityConnectionToMatchSlice(expectedEntities, secondResult, -10 - 20, -10);
  assertPageInfoEquals(secondResult, { hasPreviousPage: true, hasNextPage: true });
}

async function getEntities_pagingFirstBetween({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
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
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    secondResult,
    3 /*inclusive*/,
    8 /*exclusive*/,
  );
  // No next since we're paging forwards and there's a 'before'
  assertPageInfoEquals(secondResult, { hasPreviousPage: true, hasNextPage: false });
}

async function getEntities_pagingLastBetween({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
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
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    secondResult,
    3 /*inclusive*/,
    8 /*exclusive*/,
  );
  // No prev since we're paging backwards and there's a 'after'
  assertPageInfoEquals(secondResult, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_orderCreatedAt({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await clientProvider.adminClient().getEntities({
    entityTypes: ['ReadOnly'],
    order: AdminEntityQueryOrder.createdAt,
  });
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    AdminEntityQueryOrder.createdAt,
  );
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_orderCreatedAtReversed({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await clientProvider.adminClient().getEntities({
    entityTypes: ['ReadOnly'],
    order: AdminEntityQueryOrder.createdAt,
    reverse: true,
  });
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    AdminEntityQueryOrder.createdAt,
    true,
  );
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_orderUpdatedAt({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();

  // The postgres backend sometimes `updated` that's slightly off from `updated_at`. I believe it's
  // due to NOW() being fixed by transaction.
  // Check that all updatedAt are after the previous updatedAt, with a small adjustment.

  let count = 0;
  let previousUpdatedAt: Date | null = null;

  const adminClient = clientProvider.adminClient();
  for await (const node of getAllNodesForConnection({ first: 50 }, (currentPaging) =>
    adminClient.getEntities(
      { entityTypes: ['ReadOnly'], order: AdminEntityQueryOrder.updatedAt },
      currentPaging,
    ),
  )) {
    assertOkResult(node);
    count++;
    const {
      info: { updatedAt },
    } = node.value;
    if (previousUpdatedAt) {
      const adjustedUpdatedAt = updatedAt.getTime() + 20;
      assertTruthy(previousUpdatedAt.getTime() < adjustedUpdatedAt);
    }
    previousUpdatedAt = updatedAt;
  }

  assertEquals(count, expectedEntities.length);
}

async function getEntities_orderUpdatedAtReversed({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();

  // The postgres backend sometimes `updated` that's slightly off from `updated_at`. I believe it's
  // due to NOW() being fixed by transaction.
  // Check that all updatedAt are before the previous updatedAt, with a small adjustment.

  let count = 0;
  let previousUpdatedAt: Date | null = null;

  const adminClient = clientProvider.adminClient();
  for await (const node of getAllNodesForConnection({ first: 50 }, (currentPaging) =>
    adminClient.getEntities(
      { entityTypes: ['ReadOnly'], order: AdminEntityQueryOrder.updatedAt, reverse: true },
      currentPaging,
    ),
  )) {
    assertOkResult(node);
    count++;
    const {
      info: { updatedAt },
    } = node.value;
    if (previousUpdatedAt) {
      const adjustedUpdatedAt = updatedAt.getTime() - 20;
      assertTruthy(previousUpdatedAt.getTime() > adjustedUpdatedAt);
    }
    previousUpdatedAt = updatedAt;
  }

  assertEquals(count, expectedEntities.length);
}

async function getEntities_orderName({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await clientProvider.adminClient().getEntities({
    entityTypes: ['ReadOnly'],
    order: AdminEntityQueryOrder.name,
  });
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    AdminEntityQueryOrder.name,
  );
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_orderNameReversed({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await clientProvider.adminClient().getEntities({
    entityTypes: ['ReadOnly'],
    order: AdminEntityQueryOrder.name,
    reverse: true,
  });
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    AdminEntityQueryOrder.name,
    true,
  );
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_statusDraft({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.adminClient(), {
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.draft],
  });
  assertOkResult(statusesResult);
  const { [AdminEntityStatus.draft]: draft, valid, ...otherStatuses } = statusesResult.value;
  assertTruthy(draft > 0);
  assertTruthy(valid > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    [AdminEntityStatus.archived]: 0,
    invalid: 0,
  });
}

async function getEntities_statusPublished({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.adminClient(), {
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.published],
  });
  assertOkResult(statusesResult);
  const {
    [AdminEntityStatus.published]: published,
    valid,
    ...otherStatuses
  } = statusesResult.value;
  assertTruthy(published > 0);
  assertTruthy(valid > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    [AdminEntityStatus.archived]: 0,
    invalid: 0,
  });
}

async function getEntities_statusModified({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.adminClient(), {
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.modified],
  });
  assertOkResult(statusesResult);
  const { [AdminEntityStatus.modified]: modified, valid, ...otherStatuses } = statusesResult.value;
  assertTruthy(modified > 0);
  assertTruthy(valid > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    [AdminEntityStatus.archived]: 0,
    invalid: 0,
  });
}

async function getEntities_statusWithdrawn({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.adminClient(), {
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.withdrawn],
  });
  assertOkResult(statusesResult);
  const {
    [AdminEntityStatus.withdrawn]: withdrawn,
    valid,
    ...otherStatuses
  } = statusesResult.value;
  assertTruthy(withdrawn > 0);
  assertTruthy(valid > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.archived]: 0,
    invalid: 0,
  });
}

async function getEntities_statusArchived({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.adminClient(), {
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.archived],
  });
  assertOkResult(statusesResult);
  const { [AdminEntityStatus.archived]: archived, valid, ...otherStatuses } = statusesResult.value;
  assertTruthy(archived > 0);
  assertTruthy(valid > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    invalid: 0,
  });
}

async function getEntities_statusDraftArchived({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.adminClient(), {
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.draft, AdminEntityStatus.archived],
  });
  assertOkResult(statusesResult);
  const {
    [AdminEntityStatus.draft]: draft,
    [AdminEntityStatus.archived]: archived,
    valid,
    ...otherStatuses
  } = statusesResult.value;
  assertTruthy(draft > 0);
  assertTruthy(archived > 0);
  assertTruthy(valid > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    invalid: 0,
  });
}

async function getEntities_statusModifiedPublished({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.adminClient(), {
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.modified, AdminEntityStatus.published],
  });
  assertOkResult(statusesResult);
  const {
    [AdminEntityStatus.modified]: modified,
    [AdminEntityStatus.published]: published,
    valid,
    ...otherStatuses
  } = statusesResult.value;
  assertTruthy(modified > 0);
  assertTruthy(published > 0);
  assertTruthy(valid > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    [AdminEntityStatus.archived]: 0,
    invalid: 0,
  });
}

async function getEntities_statusAll({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.adminClient(), {
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

async function getEntities_invalidOnly({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const { entity } = (
    await createInvalidEntity(adminClient, { matchPattern: 'no match' })
  ).valueOrThrow();

  const matches = await countSearchResultWithEntity(
    adminClient,
    { entityTypes: ['ChangeValidations'], valid: false },
    entity.id,
  );
  assertResultValue(matches, 1);

  const { valid, invalid } = (
    await countSearchResultStatuses(clientProvider.adminClient(), {
      entityTypes: ['ChangeValidations'],
      valid: false,
    })
  ).valueOrThrow();

  assertEquals(valid, 0);
  assertTruthy(invalid > 0);
}

async function getEntities_validOnly({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const { entity } = (await adminClient.createEntity(CHANGE_VALIDATIONS_CREATE)).valueOrThrow();

  const matches = await countSearchResultWithEntity(
    adminClient,
    { entityTypes: ['ChangeValidations'], valid: true },
    entity.id,
  );
  assertResultValue(matches, 1);

  const { valid, invalid } = (
    await countSearchResultStatuses(clientProvider.adminClient(), {
      entityTypes: ['ChangeValidations'],
      valid: true,
    })
  ).valueOrThrow();

  assertEquals(invalid, 0);
  assertTruthy(valid > 0);
}

async function getEntities_componentTypes({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const { entity } = (await adminClient.createEntity(VALUE_ITEMS_CREATE)).valueOrThrow();

  const matchesBeforeComponent = await countSearchResultWithEntity(
    adminClient,
    { entityTypes: ['Components'], componentTypes: ['ReferencesComponent'] },
    entity.id,
  );
  assertResultValue(matchesBeforeComponent, 0);

  (
    await adminClient.updateEntity<AdminComponents>({
      id: entity.id,
      fields: { any: { type: 'ReferencesComponent', reference: null } },
    })
  ).throwIfError();

  const matchesAfterComponent = await countSearchResultWithEntity(
    adminClient,
    { entityTypes: ['Components'], componentTypes: ['ReferencesComponent'] },
    entity.id,
  );
  assertResultValue(matchesAfterComponent, 1);
}

async function getEntities_linksToOneReference({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleOnlyId } } }),
  );
  assertOkResult(referenceResult);

  const searchResult = await adminClient.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksToOneReferenceFromRichText({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(RICH_TEXTS_CREATE, {
      fields: { richText: createRichText([createRichTextEntityNode({ id: titleOnlyId })]) },
    }),
  );
  assertOkResult(referenceResult);

  const searchResult = await adminClient.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksToOneReferenceFromLinkRichText({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.valueOrThrow();

  const referenceResult = await adminClient.createEntity(
    copyEntity(RICH_TEXTS_CREATE, {
      fields: {
        richText: createRichText([
          createRichTextParagraphNode([
            createRichTextEntityLinkNode({ id: titleOnlyId }, [
              createRichTextTextNode('link text'),
            ]),
          ]),
        ]),
      },
    }),
  );
  assertOkResult(referenceResult);

  const searchResult = await adminClient.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksToOneReferenceFromComponentInRichText({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(RICH_TEXTS_CREATE, {
      fields: {
        richText: createRichText([
          createRichTextComponentNode<AdminReferencesComponent>({
            type: 'ReferencesComponent',
            reference: { id: titleOnlyId },
          }),
        ]),
      },
    }),
  );
  assertOkResult(referenceResult);

  const searchResult = await adminClient.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksToFromAdminOnlyField({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();

  const {
    entity: { id: titleOnlyId },
  } = (await adminClient.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();

  const referenceCreateResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { anyAdminOnly: { id: titleOnlyId } } }),
    { publish: true },
  );
  assertOkResult(referenceCreateResult);

  // Is included when searching with admin client even though the field is admin only.
  const searchResult = await adminClient.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceCreateResult.value.entity]);
}

async function getEntities_linksToNoReferences({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const searchResult = await adminClient.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, []);
}

async function getEntities_linksToTwoReferencesFromOneEntity({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, {
      fields: { any: { id: titleOnlyId }, titleOnly: { id: titleOnlyId } },
    }),
  );
  assertOkResult(referenceResult);

  const searchResult = await adminClient.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksFromOneReference({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const { entity: titleOnlyEntity } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleOnlyEntity.id } } }),
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const searchResult = await adminClient.getEntities({ linksFrom: { id: referenceId } });
  assertSearchResultEntities(searchResult, [titleOnlyEntity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksFromNoReferences({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const referenceResult = await adminClient.createEntity(REFERENCES_CREATE);
  assertOkResult(referenceResult);
  const {
    entity: { id },
  } = referenceResult.value;

  const searchResult = await adminClient.getEntities({ linksFrom: { id } });
  assertSearchResultEntities(searchResult, []);
}

async function getEntities_linksFromTwoReferencesFromOneEntity({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const { entity: titleOnlyEntity } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, {
      fields: { any: { id: titleOnlyEntity.id }, titleOnly: { id: titleOnlyEntity.id } },
    }),
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const searchResult = await adminClient.getEntities({ linksFrom: { id: referenceId } });
  assertSearchResultEntities(searchResult, [titleOnlyEntity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_boundingBoxOneInside({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const boundingBox = randomBoundingBox();
  const center = boundingBoxCenter(boundingBox);
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: center } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(adminClient, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function getEntities_boundingBoxOneInsideFromComponentInRichText({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const boundingBox = randomBoundingBox();
  const center = boundingBoxCenter(boundingBox);
  const createResult = await adminClient.createEntity(
    copyEntity(RICH_TEXTS_CREATE, {
      fields: {
        richText: createRichText([
          createRichTextComponentNode<AdminLocationsComponent>({
            type: 'LocationsComponent',
            location: center,
            locationAdminOnly: null,
          }),
        ]),
      },
    }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(adminClient, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function getEntities_boundingBoxOneEntityTwoLocationsInside({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const boundingBox = randomBoundingBox();
  const center = boundingBoxCenter(boundingBox);
  const inside = boundingBoxBelowCenter(boundingBox);
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: center, locationList: [inside] } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(adminClient, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function getEntities_boundingBoxOneInsideFromAdminOnlyField({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const boundingBox = randomBoundingBox();
  const center = boundingBoxCenter(boundingBox);
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { locationAdminOnly: center } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(adminClient, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function getEntities_boundingBoxOneOutside({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const boundingBox = randomBoundingBox();
  const outside = {
    lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
    lng: boundingBox.minLng > 0 ? boundingBox.minLng - 1 : boundingBox.maxLng + 1,
  };
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: outside } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(adminClient, { boundingBox }, id);
  assertResultValue(matches, 0);
}

async function getEntities_boundingBoxWrappingMaxMinLongitude({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const boundingBox: BoundingBox = { minLat: -50, maxLat: -49, minLng: 179, maxLng: -179 };
  const center = boundingBoxCenter(boundingBox);
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: center } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(adminClient, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function getEntities_authKeySubject({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities(['subject']);
  const result = await clientProvider.adminClient().getEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
  assertPageInfoEquals(result, {
    hasPreviousPage: false,
    hasNextPage: expectedEntities.length > 25,
  });
}

async function getEntities_authKeySubjectFromReadonlyRandom({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient('random', 'readonly');

  const result = await adminClient.getEntities({ authKeys: ['subject'] });
  assertResultValue(result, null);
}

async function getEntities_textIncludedAfterCreation({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      fields: { title: 'this is a serious title with the best insights' },
    }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(adminClient, { text: 'serious insights' }, id);
  assertResultValue(matches, 1);
}

async function getEntities_textIncludedInAdminOnlyFieldAfterCreation({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(
    copyEntity(STRINGS_CREATE, {
      fields: {
        stringAdminOnly:
          'pizza includes these three ingredients: pineapple, blue cheese and broccoli',
      },
    }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(adminClient, { text: 'broccoli' }, id);
  assertResultValue(matches, 1);
}

async function getEntities_textIncludedAfterUpdate({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matchesBeforeUpdate = await countSearchResultWithEntity(
    adminClient,
    { text: 'fox jumping' },
    id,
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
    id,
  );
  assertResultValue(matchesAfterUpdate, 1);
}

async function getEntities_textExcludedAfterUpdate({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { fields: { title: "who's jumping? It it the fox" } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matchesBeforeUpdate = await countSearchResultWithEntity(
    adminClient,
    { text: 'fox jumping' },
    id,
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
    id,
  );
  assertResultValue(matchesAfterUpdate, 0);
}

async function getEntities_authKeyNoneAndSubject({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities(['', 'subject']);
  const result = await clientProvider.adminClient().getEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['', 'subject'],
  });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}
