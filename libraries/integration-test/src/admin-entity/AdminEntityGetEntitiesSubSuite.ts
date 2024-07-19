import {
  copyEntity,
  createRichText,
  createRichTextComponentNode,
  createRichTextEntityLinkNode,
  createRichTextEntityNode,
  createRichTextParagraphNode,
  createRichTextTextNode,
  EntityQueryOrder,
  EntityStatus,
  getAllNodesForConnection,
  type BoundingBox,
} from '@dossierhq/core';
import { assertEquals, assertOkResult, assertResultValue, assertTruthy } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { Components, LocationsComponent, ReferencesComponent } from '../SchemaTypes.js';
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
  getEntities_statusDefaultNoArchived,
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
  getEntities_comboLinksToAndStatus,
];

async function getEntities_minimal({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await clientProvider.dossierClient().getEntities({
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
    .dossierClient()
    .getEntities({ entityTypes: ['ReadOnly'] }, { first: 10 });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 10);
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_pagingFirst0({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider
    .dossierClient()
    .getEntities({ entityTypes: ['ReadOnly'] }, { first: 0 });
  assertResultValue(result, null);
}

async function getEntities_pagingLast({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await clientProvider
    .dossierClient()
    .getEntities({ entityTypes: ['ReadOnly'] }, { last: 10 });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, -10, undefined);
  assertPageInfoEquals(result, { hasPreviousPage: true, hasNextPage: false });
}

async function getEntities_pagingLast0({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider
    .dossierClient()
    .getEntities({ entityTypes: ['ReadOnly'] }, { last: 0 });
  assertResultValue(result, null);
}

async function getEntities_pagingFirstAfter({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
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
  const client = clientProvider.dossierClient();

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
    { linksFrom: { id: linkId }, order: EntityQueryOrder.name },
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
    { linksFrom: { id: linkId }, order: EntityQueryOrder.name },
    { first: 10, after: startCursor },
  );
  assertSearchResultEntities(secondSearchResult, [secondEntity]);
  assertPageInfoEquals(secondSearchResult, { hasPreviousPage: true, hasNextPage: false });
}

async function getEntities_pagingLastBefore({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
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
  const client = clientProvider.dossierClient();
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
  const client = clientProvider.dossierClient();
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
  const result = await clientProvider.dossierClient().getEntities({
    entityTypes: ['ReadOnly'],
    order: EntityQueryOrder.createdAt,
  });
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    EntityQueryOrder.createdAt,
  );
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_orderCreatedAtReversed({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await clientProvider.dossierClient().getEntities({
    entityTypes: ['ReadOnly'],
    order: EntityQueryOrder.createdAt,
    reverse: true,
  });
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    EntityQueryOrder.createdAt,
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

  const client = clientProvider.dossierClient();
  for await (const node of getAllNodesForConnection({ first: 50 }, (currentPaging) =>
    client.getEntities(
      { entityTypes: ['ReadOnly'], order: EntityQueryOrder.updatedAt },
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

  const client = clientProvider.dossierClient();
  for await (const node of getAllNodesForConnection({ first: 50 }, (currentPaging) =>
    client.getEntities(
      { entityTypes: ['ReadOnly'], order: EntityQueryOrder.updatedAt, reverse: true },
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
  const result = await clientProvider.dossierClient().getEntities({
    entityTypes: ['ReadOnly'],
    order: EntityQueryOrder.name,
  });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 25, EntityQueryOrder.name);
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_orderNameReversed({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await clientProvider.dossierClient().getEntities({
    entityTypes: ['ReadOnly'],
    order: EntityQueryOrder.name,
    reverse: true,
  });
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    EntityQueryOrder.name,
    true,
  );
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_statusDefaultNoArchived({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.dossierClient(), {
    entityTypes: ['ReadOnly'],
  });
  assertOkResult(statusesResult);
  const { archived, draft, modified, published, withdrawn } = statusesResult.value;
  assertEquals(archived, 0);

  assertTruthy(draft > 0);
  assertTruthy(modified > 0);
  assertTruthy(published > 0);
  assertTruthy(withdrawn > 0);
}

async function getEntities_statusDraft({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.dossierClient(), {
    entityTypes: ['ReadOnly'],
    status: [EntityStatus.draft],
  });
  assertOkResult(statusesResult);
  const { [EntityStatus.draft]: draft, valid, ...otherStatuses } = statusesResult.value;
  assertTruthy(draft > 0);
  assertTruthy(valid > 0);
  assertEquals(otherStatuses, {
    [EntityStatus.published]: 0,
    [EntityStatus.modified]: 0,
    [EntityStatus.withdrawn]: 0,
    [EntityStatus.archived]: 0,
    invalid: 0,
  });
}

async function getEntities_statusPublished({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.dossierClient(), {
    entityTypes: ['ReadOnly'],
    status: [EntityStatus.published],
  });
  assertOkResult(statusesResult);
  const { [EntityStatus.published]: published, valid, ...otherStatuses } = statusesResult.value;
  assertTruthy(published > 0);
  assertTruthy(valid > 0);
  assertEquals(otherStatuses, {
    [EntityStatus.draft]: 0,
    [EntityStatus.modified]: 0,
    [EntityStatus.withdrawn]: 0,
    [EntityStatus.archived]: 0,
    invalid: 0,
  });
}

async function getEntities_statusModified({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.dossierClient(), {
    entityTypes: ['ReadOnly'],
    status: [EntityStatus.modified],
  });
  assertOkResult(statusesResult);
  const { [EntityStatus.modified]: modified, valid, ...otherStatuses } = statusesResult.value;
  assertTruthy(modified > 0);
  assertTruthy(valid > 0);
  assertEquals(otherStatuses, {
    [EntityStatus.draft]: 0,
    [EntityStatus.published]: 0,
    [EntityStatus.withdrawn]: 0,
    [EntityStatus.archived]: 0,
    invalid: 0,
  });
}

async function getEntities_statusWithdrawn({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.dossierClient(), {
    entityTypes: ['ReadOnly'],
    status: [EntityStatus.withdrawn],
  });
  assertOkResult(statusesResult);
  const { [EntityStatus.withdrawn]: withdrawn, valid, ...otherStatuses } = statusesResult.value;
  assertTruthy(withdrawn > 0);
  assertTruthy(valid > 0);
  assertEquals(otherStatuses, {
    [EntityStatus.draft]: 0,
    [EntityStatus.published]: 0,
    [EntityStatus.modified]: 0,
    [EntityStatus.archived]: 0,
    invalid: 0,
  });
}

async function getEntities_statusArchived({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.dossierClient(), {
    entityTypes: ['ReadOnly'],
    status: [EntityStatus.archived],
  });
  assertOkResult(statusesResult);
  const { [EntityStatus.archived]: archived, valid, ...otherStatuses } = statusesResult.value;
  assertTruthy(archived > 0);
  assertTruthy(valid > 0);
  assertEquals(otherStatuses, {
    [EntityStatus.draft]: 0,
    [EntityStatus.published]: 0,
    [EntityStatus.modified]: 0,
    [EntityStatus.withdrawn]: 0,
    invalid: 0,
  });
}

async function getEntities_statusDraftArchived({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.dossierClient(), {
    entityTypes: ['ReadOnly'],
    status: [EntityStatus.draft, EntityStatus.archived],
  });
  assertOkResult(statusesResult);
  const {
    [EntityStatus.draft]: draft,
    [EntityStatus.archived]: archived,
    valid,
    ...otherStatuses
  } = statusesResult.value;
  assertTruthy(draft > 0);
  assertTruthy(archived > 0);
  assertTruthy(valid > 0);
  assertEquals(otherStatuses, {
    [EntityStatus.published]: 0,
    [EntityStatus.modified]: 0,
    [EntityStatus.withdrawn]: 0,
    invalid: 0,
  });
}

async function getEntities_statusModifiedPublished({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.dossierClient(), {
    entityTypes: ['ReadOnly'],
    status: [EntityStatus.modified, EntityStatus.published],
  });
  assertOkResult(statusesResult);
  const {
    [EntityStatus.modified]: modified,
    [EntityStatus.published]: published,
    valid,
    ...otherStatuses
  } = statusesResult.value;
  assertTruthy(modified > 0);
  assertTruthy(published > 0);
  assertTruthy(valid > 0);
  assertEquals(otherStatuses, {
    [EntityStatus.draft]: 0,
    [EntityStatus.withdrawn]: 0,
    [EntityStatus.archived]: 0,
    invalid: 0,
  });
}

async function getEntities_statusAll({ clientProvider }: AdminEntityTestContext) {
  const statusesResult = await countSearchResultStatuses(clientProvider.dossierClient(), {
    entityTypes: ['ReadOnly'],
    status: [
      EntityStatus.draft,
      EntityStatus.published,
      EntityStatus.modified,
      EntityStatus.archived,
      EntityStatus.withdrawn,
    ],
  });
  assertOkResult(statusesResult);
  const {
    [EntityStatus.draft]: draft,
    [EntityStatus.archived]: archived,
    [EntityStatus.published]: published,
    [EntityStatus.modified]: modified,
    [EntityStatus.withdrawn]: withdrawn,
  } = statusesResult.value;
  assertTruthy(draft > 0);
  assertTruthy(archived > 0);
  assertTruthy(published > 0);
  assertTruthy(modified > 0);
  assertTruthy(withdrawn > 0);
}

async function getEntities_invalidOnly({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const { entity } = (
    await createInvalidEntity(client, { matchPattern: 'no match' })
  ).valueOrThrow();

  const matches = await countSearchResultWithEntity(
    client,
    { entityTypes: ['ChangeValidations'], valid: false },
    entity.id,
  );
  assertResultValue(matches, 1);

  const { valid, invalid } = (
    await countSearchResultStatuses(clientProvider.dossierClient(), {
      entityTypes: ['ChangeValidations'],
      valid: false,
    })
  ).valueOrThrow();

  assertEquals(valid, 0);
  assertTruthy(invalid > 0);
}

async function getEntities_validOnly({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const { entity } = (await client.createEntity(CHANGE_VALIDATIONS_CREATE)).valueOrThrow();

  const matches = await countSearchResultWithEntity(
    client,
    { entityTypes: ['ChangeValidations'], valid: true },
    entity.id,
  );
  assertResultValue(matches, 1);

  const { valid, invalid } = (
    await countSearchResultStatuses(clientProvider.dossierClient(), {
      entityTypes: ['ChangeValidations'],
      valid: true,
    })
  ).valueOrThrow();

  assertEquals(invalid, 0);
  assertTruthy(valid > 0);
}

async function getEntities_componentTypes({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const { entity } = (await client.createEntity(VALUE_ITEMS_CREATE)).valueOrThrow();

  const matchesBeforeComponent = await countSearchResultWithEntity(
    client,
    { entityTypes: ['Components'], componentTypes: ['ReferencesComponent'] },
    entity.id,
  );
  assertResultValue(matchesBeforeComponent, 0);

  (
    await client.updateEntity<Components>({
      id: entity.id,
      fields: { any: { type: 'ReferencesComponent', reference: null } },
    })
  ).throwIfError();

  const matchesAfterComponent = await countSearchResultWithEntity(
    client,
    { entityTypes: ['Components'], componentTypes: ['ReferencesComponent'] },
    entity.id,
  );
  assertResultValue(matchesAfterComponent, 1);
}

async function getEntities_linksToOneReference({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const titleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await client.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleOnlyId } } }),
  );
  assertOkResult(referenceResult);

  const searchResult = await client.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksToOneReferenceFromRichText({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const titleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await client.createEntity(
    copyEntity(RICH_TEXTS_CREATE, {
      fields: { richText: createRichText([createRichTextEntityNode({ id: titleOnlyId })]) },
    }),
  );
  assertOkResult(referenceResult);

  const searchResult = await client.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksToOneReferenceFromLinkRichText({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const titleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.valueOrThrow();

  const referenceResult = await client.createEntity(
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

  const searchResult = await client.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksToOneReferenceFromComponentInRichText({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const titleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await client.createEntity(
    copyEntity(RICH_TEXTS_CREATE, {
      fields: {
        richText: createRichText([
          createRichTextComponentNode<ReferencesComponent>({
            type: 'ReferencesComponent',
            reference: { id: titleOnlyId },
          }),
        ]),
      },
    }),
  );
  assertOkResult(referenceResult);

  const searchResult = await client.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksToFromAdminOnlyField({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const {
    entity: { id: titleOnlyId },
  } = (await client.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();

  const referenceCreateResult = await client.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { anyAdminOnly: { id: titleOnlyId } } }),
    { publish: true },
  );
  assertOkResult(referenceCreateResult);

  // Is included when searching with Dossier client even though the field is admin only.
  const searchResult = await client.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceCreateResult.value.entity]);
}

async function getEntities_linksToNoReferences({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const titleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const searchResult = await client.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, []);
}

async function getEntities_linksToTwoReferencesFromOneEntity({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const titleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await client.createEntity(
    copyEntity(REFERENCES_CREATE, {
      fields: { any: { id: titleOnlyId }, titleOnly: { id: titleOnlyId } },
    }),
  );
  assertOkResult(referenceResult);

  const searchResult = await client.getEntities({ linksTo: { id: titleOnlyId } });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksFromOneReference({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const titleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const { entity: titleOnlyEntity } = titleOnlyResult.value;

  const referenceResult = await client.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleOnlyEntity.id } } }),
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const searchResult = await client.getEntities({ linksFrom: { id: referenceId } });
  assertSearchResultEntities(searchResult, [titleOnlyEntity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_linksFromNoReferences({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const referenceResult = await client.createEntity(REFERENCES_CREATE);
  assertOkResult(referenceResult);
  const {
    entity: { id },
  } = referenceResult.value;

  const searchResult = await client.getEntities({ linksFrom: { id } });
  assertSearchResultEntities(searchResult, []);
}

async function getEntities_linksFromTwoReferencesFromOneEntity({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const titleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const { entity: titleOnlyEntity } = titleOnlyResult.value;

  const referenceResult = await client.createEntity(
    copyEntity(REFERENCES_CREATE, {
      fields: { any: { id: titleOnlyEntity.id }, titleOnly: { id: titleOnlyEntity.id } },
    }),
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const searchResult = await client.getEntities({ linksFrom: { id: referenceId } });
  assertSearchResultEntities(searchResult, [titleOnlyEntity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}

async function getEntities_boundingBoxOneInside({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const boundingBox = randomBoundingBox();
  const center = boundingBoxCenter(boundingBox);
  const createResult = await client.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: center } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(client, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function getEntities_boundingBoxOneInsideFromComponentInRichText({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const boundingBox = randomBoundingBox();
  const center = boundingBoxCenter(boundingBox);
  const createResult = await client.createEntity(
    copyEntity(RICH_TEXTS_CREATE, {
      fields: {
        richText: createRichText([
          createRichTextComponentNode<LocationsComponent>({
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

  const matches = await countSearchResultWithEntity(client, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function getEntities_boundingBoxOneEntityTwoLocationsInside({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const boundingBox = randomBoundingBox();
  const center = boundingBoxCenter(boundingBox);
  const inside = boundingBoxBelowCenter(boundingBox);
  const createResult = await client.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: center, locationList: [inside] } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(client, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function getEntities_boundingBoxOneInsideFromAdminOnlyField({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const boundingBox = randomBoundingBox();
  const center = boundingBoxCenter(boundingBox);
  const createResult = await client.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { locationAdminOnly: center } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(client, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function getEntities_boundingBoxOneOutside({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const boundingBox = randomBoundingBox();
  const outside = {
    lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
    lng: boundingBox.minLng > 0 ? boundingBox.minLng - 1 : boundingBox.maxLng + 1,
  };
  const createResult = await client.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: outside } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(client, { boundingBox }, id);
  assertResultValue(matches, 0);
}

async function getEntities_boundingBoxWrappingMaxMinLongitude({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const boundingBox: BoundingBox = { minLat: -50, maxLat: -49, minLng: 179, maxLng: -179 };
  const center = boundingBoxCenter(boundingBox);
  const createResult = await client.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: center } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(client, { boundingBox }, id);
  assertResultValue(matches, 1);
}

async function getEntities_authKeySubject({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities({
    authKeys: ['subject'],
  });
  const result = await clientProvider.dossierClient().getEntities({
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
  const client = clientProvider.dossierClient('random', 'readonly');

  const result = await client.getEntities({ authKeys: ['subject'] });
  assertResultValue(result, null);
}

async function getEntities_textIncludedAfterCreation({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      fields: { title: 'this is a serious title with the best insights' },
    }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matches = await countSearchResultWithEntity(client, { text: 'serious insights' }, id);
  assertResultValue(matches, 1);
}

async function getEntities_textIncludedInAdminOnlyFieldAfterCreation({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(
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

  const matches = await countSearchResultWithEntity(client, { text: 'broccoli' }, id);
  assertResultValue(matches, 1);
}

async function getEntities_textIncludedAfterUpdate({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matchesBeforeUpdate = await countSearchResultWithEntity(
    client,
    { text: 'fox jumping' },
    id,
  );
  assertResultValue(matchesBeforeUpdate, 0);

  const updateResult = await client.updateEntity({
    id,
    fields: { title: "who's jumping? It it the fox" },
  });
  assertOkResult(updateResult);

  const matchesAfterUpdate = await countSearchResultWithEntity(client, { text: 'fox jumping' }, id);
  assertResultValue(matchesAfterUpdate, 1);
}

async function getEntities_textExcludedAfterUpdate({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { fields: { title: "who's jumping? It it the fox" } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const matchesBeforeUpdate = await countSearchResultWithEntity(
    client,
    { text: 'fox jumping' },
    id,
  );
  assertResultValue(matchesBeforeUpdate, 1);

  const updateResult = await client.updateEntity({
    id,
    fields: { title: 'Random title' },
  });
  assertOkResult(updateResult);

  const matchesAfterUpdate = await countSearchResultWithEntity(client, { text: 'fox jumping' }, id);
  assertResultValue(matchesAfterUpdate, 0);
}

async function getEntities_authKeyNoneAndSubject({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities({
    authKeys: ['', 'subject'],
  });
  const result = await clientProvider.dossierClient().getEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['', 'subject'],
  });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
  assertPageInfoEquals(result, { hasPreviousPage: false, hasNextPage: true });
}

async function getEntities_comboLinksToAndStatus({ clientProvider }: AdminEntityTestContext) {
  // Regression test for ambiguous column name: status
  const client = clientProvider.dossierClient();
  const titleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.valueOrThrow();

  const referenceResult = await client.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleOnlyId } } }),
  );
  assertOkResult(referenceResult);

  const searchResult = await client.getEntities({
    linksTo: { id: titleOnlyId },
    status: ['draft'],
  });
  assertSearchResultEntities(searchResult, [referenceResult.value.entity]);
  assertPageInfoEquals(searchResult, { hasPreviousPage: false, hasNextPage: false });
}
