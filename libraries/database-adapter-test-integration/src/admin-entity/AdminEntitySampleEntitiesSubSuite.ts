import { AdminEntityStatus, copyEntity } from '@jonasb/datadata-core';
import { assertEquals, assertOkResult, assertResultValue, assertTruthy } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { REFERENCES_CREATE, TITLE_ONLY_CREATE } from '../shared-entity/Fixtures';
import {
  assertSampledEntitiesArePartOfExpected,
  countEntityStatuses,
} from '../shared-entity/SampleTestUtils';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

export const SampleEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  sampleEntities_minimal,
  sampleEntities_statusDraft,
  sampleEntities_statusPublished,
  sampleEntities_statusModified,
  sampleEntities_statusWithdrawn,
  sampleEntities_statusArchived,
  sampleEntities_statusDraftArchived,
  sampleEntities_statusModifiedPublished,
  sampleEntities_statusAll,
  sampleEntities_referenceOneReference,
  sampleEntities_referenceNoReferences,
  sampleEntities_referenceTwoReferencesFromOneEntity,
  sampleEntities_authKeySubject,
  sampleEntities_authKeyNoneAndSubject,
];

async function sampleEntities_minimal({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
  });
  assertOkResult(result);
  assertEquals(result.value.totalCount, expectedEntities.length);
  assertEquals(result.value.items.length, 25);
  assertEquals(typeof result.value.seed, 'number');
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function sampleEntities_statusDraft({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.draft],
  });
  assertOkResult(result);

  const { [AdminEntityStatus.draft]: draft, ...otherStatuses } = countEntityStatuses(
    result.value.items
  );
  assertTruthy(draft > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    [AdminEntityStatus.archived]: 0,
  });
}

async function sampleEntities_statusPublished({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.published],
  });
  assertOkResult(result);

  const { [AdminEntityStatus.published]: published, ...otherStatuses } = countEntityStatuses(
    result.value.items
  );
  assertTruthy(published > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    [AdminEntityStatus.archived]: 0,
  });
}

async function sampleEntities_statusModified({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.modified],
  });
  assertOkResult(result);

  const { [AdminEntityStatus.modified]: modified, ...otherStatuses } = countEntityStatuses(
    result.value.items
  );
  assertTruthy(modified > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    [AdminEntityStatus.archived]: 0,
  });
}

async function sampleEntities_statusWithdrawn({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.withdrawn],
  });
  assertOkResult(result);

  const { [AdminEntityStatus.withdrawn]: withdrawn, ...otherStatuses } = countEntityStatuses(
    result.value.items
  );
  assertTruthy(withdrawn > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.archived]: 0,
  });
}

async function sampleEntities_statusArchived({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.archived],
  });
  assertOkResult(result);

  const { [AdminEntityStatus.archived]: archived, ...otherStatuses } = countEntityStatuses(
    result.value.items
  );
  assertTruthy(archived > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.withdrawn]: 0,
  });
}

async function sampleEntities_statusDraftArchived({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.draft, AdminEntityStatus.archived],
  });
  assertOkResult(result);

  const {
    [AdminEntityStatus.draft]: draft,
    [AdminEntityStatus.archived]: archived,
    ...otherStatuses
  } = countEntityStatuses(result.value.items);
  assertTruthy(draft > 0);
  assertTruthy(archived > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.published]: 0,
    [AdminEntityStatus.modified]: 0,
    [AdminEntityStatus.withdrawn]: 0,
  });
}

async function sampleEntities_statusModifiedPublished({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.modified, AdminEntityStatus.published],
  });
  assertOkResult(result);

  const {
    [AdminEntityStatus.modified]: modified,
    [AdminEntityStatus.published]: published,
    ...otherStatuses
  } = countEntityStatuses(result.value.items);
  assertTruthy(modified > 0);
  assertTruthy(published > 0);
  assertEquals(otherStatuses, {
    [AdminEntityStatus.draft]: 0,
    [AdminEntityStatus.withdrawn]: 0,
    [AdminEntityStatus.archived]: 0,
  });
}

async function sampleEntities_statusAll({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
    status: [
      AdminEntityStatus.draft,
      AdminEntityStatus.published,
      AdminEntityStatus.modified,
      AdminEntityStatus.archived,
      AdminEntityStatus.withdrawn,
    ],
  });
  assertOkResult(result);

  const {
    [AdminEntityStatus.draft]: draft,
    [AdminEntityStatus.archived]: archived,
    [AdminEntityStatus.published]: published,
    [AdminEntityStatus.modified]: modified,
    [AdminEntityStatus.withdrawn]: withdrawn,
  } = countEntityStatuses(result.value.items);
  assertTruthy(draft > 0);
  assertTruthy(archived > 0);
  assertTruthy(published > 0);
  assertTruthy(modified > 0);
  assertTruthy(withdrawn > 0);
}

async function sampleEntities_referenceOneReference({ server }: AdminEntityTestContext) {
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

  const sampleResult = await adminClient.sampleEntities(
    { referencing: titleOnlyId },
    { seed: 123 }
  );
  assertResultValue(sampleResult, {
    seed: 123,
    totalCount: 1,
    items: [referenceResult.value.entity],
  });
}

async function sampleEntities_referenceNoReferences({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const sampleResult = await adminClient.sampleEntities(
    { referencing: titleOnlyId },
    { seed: 456 }
  );
  assertResultValue(sampleResult, {
    seed: 456,
    totalCount: 0,
    items: [],
  });
}

async function sampleEntities_referenceTwoReferencesFromOneEntity({
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

  const sampleResult = await adminClient.sampleEntities(
    { referencing: titleOnlyId },
    { seed: 789 }
  );
  assertResultValue(sampleResult, {
    seed: 789,
    totalCount: 1,
    items: [referenceResult.value.entity],
  });
}

async function sampleEntities_authKeySubject({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities(['subject']);
  const result = await adminClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function sampleEntities_authKeyNoneAndSubject({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities([
    'none',
    'subject',
  ]);
  const result = await adminClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}
