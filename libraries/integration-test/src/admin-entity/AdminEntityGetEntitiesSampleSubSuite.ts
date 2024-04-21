import type { BoundingBox } from '@dossierhq/core';
import { EntityStatus, copyEntity } from '@dossierhq/core';
import { assertEquals, assertOkResult, assertTruthy } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  LOCATIONS_CREATE,
  REFERENCES_CREATE,
  TITLE_ONLY_CREATE,
} from '../shared-entity/Fixtures.js';
import {
  boundingBoxBelowCenter,
  boundingBoxCenter,
  randomBoundingBox,
} from '../shared-entity/LocationTestUtils.js';
import {
  assertSampledEntities,
  assertSampledEntitiesArePartOfExpected,
  countEntityStatuses,
} from '../shared-entity/SampleTestUtils.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const GetEntitiesSampleSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getEntitiesSample_minimal,
  getEntitiesSample_statusDraft,
  getEntitiesSample_statusPublished,
  getEntitiesSample_statusModified,
  getEntitiesSample_statusWithdrawn,
  getEntitiesSample_statusArchived,
  getEntitiesSample_statusDraftArchived,
  getEntitiesSample_statusModifiedPublished,
  getEntitiesSample_statusAll,
  getEntitiesSample_linksToOneReference,
  getEntitiesSample_linksToNoReferences,
  getEntitiesSample_linksToTwoReferencesFromOneEntity,
  getEntitiesSample_linksFromOneReference,
  getEntitiesSample_linksFromNoReferences,
  getEntitiesSample_linksFromTwoReferencesFromOneEntity,
  getEntitiesSample_boundingBoxOneInside,
  getEntitiesSample_boundingBoxOneEntityTwoLocationsInside,
  getEntitiesSample_boundingBoxOneOutside,
  getEntitiesSample_boundingBoxWrappingMaxMinLongitude,
  getEntitiesSample_textIncludedAfterCreation,
  getEntitiesSample_textIncludedAfterUpdate,
  getEntitiesSample_textExcludedAfterUpdate,
  getEntitiesSample_authKeySubject,
  getEntitiesSample_authKeySubjectFromReadonlyRandom,
  getEntitiesSample_authKeyNoneAndSubject,
];

async function getEntitiesSample_minimal({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await clientProvider.adminClient().getEntitiesSample({
    entityTypes: ['ReadOnly'],
  });
  assertOkResult(result);
  assertEquals(result.value.totalCount, expectedEntities.length);
  assertEquals(result.value.items.length, 25);
  assertEquals(typeof result.value.seed, 'number');
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function getEntitiesSample_statusDraft({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider.adminClient().getEntitiesSample({
    entityTypes: ['ReadOnly'],
    status: [EntityStatus.draft],
  });
  assertOkResult(result);

  const { [EntityStatus.draft]: draft, ...otherStatuses } = countEntityStatuses(result.value.items);
  assertTruthy(draft > 0);
  assertEquals(otherStatuses, {
    [EntityStatus.published]: 0,
    [EntityStatus.modified]: 0,
    [EntityStatus.withdrawn]: 0,
    [EntityStatus.archived]: 0,
  });
}

async function getEntitiesSample_statusPublished({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider.adminClient().getEntitiesSample({
    entityTypes: ['ReadOnly'],
    status: [EntityStatus.published],
  });
  assertOkResult(result);

  const { [EntityStatus.published]: published, ...otherStatuses } = countEntityStatuses(
    result.value.items,
  );
  assertTruthy(published > 0);
  assertEquals(otherStatuses, {
    [EntityStatus.draft]: 0,
    [EntityStatus.modified]: 0,
    [EntityStatus.withdrawn]: 0,
    [EntityStatus.archived]: 0,
  });
}

async function getEntitiesSample_statusModified({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider.adminClient().getEntitiesSample({
    entityTypes: ['ReadOnly'],
    status: [EntityStatus.modified],
  });
  assertOkResult(result);

  const { [EntityStatus.modified]: modified, ...otherStatuses } = countEntityStatuses(
    result.value.items,
  );
  assertTruthy(modified > 0);
  assertEquals(otherStatuses, {
    [EntityStatus.draft]: 0,
    [EntityStatus.published]: 0,
    [EntityStatus.withdrawn]: 0,
    [EntityStatus.archived]: 0,
  });
}

async function getEntitiesSample_statusWithdrawn({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider.adminClient().getEntitiesSample({
    entityTypes: ['ReadOnly'],
    status: [EntityStatus.withdrawn],
  });
  assertOkResult(result);

  const { [EntityStatus.withdrawn]: withdrawn, ...otherStatuses } = countEntityStatuses(
    result.value.items,
  );
  assertTruthy(withdrawn > 0);
  assertEquals(otherStatuses, {
    [EntityStatus.draft]: 0,
    [EntityStatus.published]: 0,
    [EntityStatus.modified]: 0,
    [EntityStatus.archived]: 0,
  });
}

async function getEntitiesSample_statusArchived({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider.adminClient().getEntitiesSample({
    entityTypes: ['ReadOnly'],
    status: [EntityStatus.archived],
  });
  assertOkResult(result);

  const { [EntityStatus.archived]: archived, ...otherStatuses } = countEntityStatuses(
    result.value.items,
  );
  assertTruthy(archived > 0);
  assertEquals(otherStatuses, {
    [EntityStatus.draft]: 0,
    [EntityStatus.published]: 0,
    [EntityStatus.modified]: 0,
    [EntityStatus.withdrawn]: 0,
  });
}

async function getEntitiesSample_statusDraftArchived({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider.adminClient().getEntitiesSample({
    entityTypes: ['ReadOnly'],
    status: [EntityStatus.draft, EntityStatus.archived],
  });
  assertOkResult(result);

  const {
    [EntityStatus.draft]: draft,
    [EntityStatus.archived]: archived,
    ...otherStatuses
  } = countEntityStatuses(result.value.items);
  assertTruthy(draft > 0);
  assertTruthy(archived > 0);
  assertEquals(otherStatuses, {
    [EntityStatus.published]: 0,
    [EntityStatus.modified]: 0,
    [EntityStatus.withdrawn]: 0,
  });
}

async function getEntitiesSample_statusModifiedPublished({
  clientProvider,
}: AdminEntityTestContext) {
  const result = await clientProvider.adminClient().getEntitiesSample({
    entityTypes: ['ReadOnly'],
    status: [EntityStatus.modified, EntityStatus.published],
  });
  assertOkResult(result);

  const {
    [EntityStatus.modified]: modified,
    [EntityStatus.published]: published,
    ...otherStatuses
  } = countEntityStatuses(result.value.items);
  assertTruthy(modified > 0);
  assertTruthy(published > 0);
  assertEquals(otherStatuses, {
    [EntityStatus.draft]: 0,
    [EntityStatus.withdrawn]: 0,
    [EntityStatus.archived]: 0,
  });
}

async function getEntitiesSample_statusAll({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider.adminClient().getEntitiesSample({
    entityTypes: ['ReadOnly'],
    status: [
      EntityStatus.draft,
      EntityStatus.published,
      EntityStatus.modified,
      EntityStatus.archived,
      EntityStatus.withdrawn,
    ],
  });
  assertOkResult(result);

  const {
    [EntityStatus.draft]: draft,
    [EntityStatus.archived]: archived,
    [EntityStatus.published]: published,
    [EntityStatus.modified]: modified,
    [EntityStatus.withdrawn]: withdrawn,
  } = countEntityStatuses(result.value.items);
  assertTruthy(draft > 0);
  assertTruthy(archived > 0);
  assertTruthy(published > 0);
  assertTruthy(modified > 0);
  assertTruthy(withdrawn > 0);
}

async function getEntitiesSample_linksToOneReference({ clientProvider }: AdminEntityTestContext) {
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

  const sampleResult = await adminClient.getEntitiesSample(
    { linksTo: { id: titleOnlyId } },
    { seed: 123 },
  );
  assertSampledEntities(sampleResult, 123, [referenceResult.value.entity]);
}

async function getEntitiesSample_linksToNoReferences({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const sampleResult = await adminClient.getEntitiesSample(
    { linksTo: { id: titleOnlyId } },
    { seed: 456 },
  );
  assertSampledEntities(sampleResult, 456, []);
}

async function getEntitiesSample_linksToTwoReferencesFromOneEntity({
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

  const sampleResult = await adminClient.getEntitiesSample(
    { linksTo: { id: titleOnlyId } },
    { seed: 789 },
  );
  assertSampledEntities(sampleResult, 789, [referenceResult.value.entity]);
}

async function getEntitiesSample_linksFromOneReference({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const { entity: titleEntity } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleEntity.id } } }),
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const sampleResult = await adminClient.getEntitiesSample(
    { linksFrom: { id: referenceId } },
    { seed: 123 },
  );
  assertSampledEntities(sampleResult, 123, [titleEntity]);
}

async function getEntitiesSample_linksFromNoReferences({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const referenceResult = await adminClient.createEntity(REFERENCES_CREATE);
  assertOkResult(referenceResult);
  const {
    entity: { id },
  } = referenceResult.value;

  const sampleResult = await adminClient.getEntitiesSample({ linksFrom: { id } }, { seed: 456 });
  assertSampledEntities(sampleResult, 456, []);
}

async function getEntitiesSample_linksFromTwoReferencesFromOneEntity({
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

  const sampleResult = await adminClient.getEntitiesSample(
    { linksFrom: { id: referenceId } },
    { seed: 789 },
  );
  assertSampledEntities(sampleResult, 789, [titleOnlyEntity]);
}

async function getEntitiesSample_boundingBoxOneInside({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const boundingBox = randomBoundingBox();

  const center = boundingBoxCenter(boundingBox);
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: center } }),
  );
  assertOkResult(createResult);
  const { entity: locationsEntity } = createResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { anyList: [{ id: locationsEntity.id }] } }),
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const sampleResult = await adminClient.getEntitiesSample(
    {
      boundingBox,
      linksFrom: { id: referenceId },
    },
    { seed: 123 },
  );
  assertSampledEntities(sampleResult, 123, [locationsEntity]);
}

async function getEntitiesSample_boundingBoxOneEntityTwoLocationsInside({
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

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { anyList: [{ id }] } }),
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const sampleResult = await adminClient.getEntitiesSample(
    { boundingBox, linksFrom: { id: referenceId } },
    { seed: 321 },
  );
  assertSampledEntities(sampleResult, 321, [{ id }]);
}

async function getEntitiesSample_boundingBoxOneOutside({ clientProvider }: AdminEntityTestContext) {
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

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { anyList: [{ id }] } }),
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const sampleResult = await adminClient.getEntitiesSample(
    {
      boundingBox,
      linksFrom: { id: referenceId },
    },
    { seed: 123 },
  );
  assertSampledEntities(sampleResult, 123, []);
}

async function getEntitiesSample_boundingBoxWrappingMaxMinLongitude({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const boundingBox: BoundingBox = { minLat: -50, maxLat: -49, minLng: 179, maxLng: -179 };
  const center = boundingBoxCenter(boundingBox);
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: center } }),
  );
  assertOkResult(createResult);
  const { entity: locationsEntity } = createResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { anyList: [{ id: locationsEntity.id }] } }),
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const sampleResult = await adminClient.getEntitiesSample(
    { boundingBox, linksFrom: { id: referenceId } },
    { seed: 321 },
  );
  assertSampledEntities(sampleResult, 321, [locationsEntity]);
}

async function getEntitiesSample_authKeySubject({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities(['subject']);
  const result = await clientProvider.adminClient().getEntitiesSample({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function getEntitiesSample_authKeySubjectFromReadonlyRandom({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient('random', 'readonly');

  const result = await adminClient.getEntitiesSample({ authKeys: ['subject'] });
  assertSampledEntitiesArePartOfExpected(result, []);
}

async function getEntitiesSample_textIncludedAfterCreation({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      fields: { title: 'this is a serious title with the best storytelling' },
    }),
  );
  assertOkResult(createResult);
  const { entity: titleOnlyEntity } = createResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { anyList: [{ id: titleOnlyEntity.id }] } }),
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const sampleResult = await adminClient.getEntitiesSample(
    { text: 'serious storytelling', linksFrom: { id: referenceId } },
    { seed: 111 },
  );
  assertSampledEntities(sampleResult, 111, [titleOnlyEntity]);
}

async function getEntitiesSample_textIncludedAfterUpdate({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { anyList: [{ id }] } }),
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  assertSampledEntities(
    await adminClient.getEntitiesSample(
      { text: 'lightning strikes', linksFrom: { id: referenceId } },
      { seed: 123 },
    ),
    123,
    [],
  );

  const updateResult = await adminClient.updateEntity({
    id,
    fields: { title: 'the lightning only strikes once' },
  });
  assertOkResult(updateResult);

  assertSampledEntities(
    await adminClient.getEntitiesSample(
      { text: 'lightning strikes', linksFrom: { id: referenceId } },
      { seed: 123 },
    ),
    123,
    [{ id }],
  );
}

async function getEntitiesSample_textExcludedAfterUpdate({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { fields: { title: "who's eating? It is the bear" } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { anyList: [{ id }] } }),
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  assertSampledEntities(
    await adminClient.getEntitiesSample(
      { text: 'bear eating', linksFrom: { id: referenceId } },
      { seed: 123 },
    ),
    123,
    [{ id }],
  );

  const updateResult = await adminClient.updateEntity({
    id,
    fields: { title: 'Random title' },
  });
  assertOkResult(updateResult);

  assertSampledEntities(
    await adminClient.getEntitiesSample(
      { text: 'bear eating', linksFrom: { id: referenceId } },
      { seed: 123 },
    ),
    123,
    [],
  );
}

async function getEntitiesSample_authKeyNoneAndSubject({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities(['', 'subject']);
  const result = await clientProvider.adminClient().getEntitiesSample({
    entityTypes: ['ReadOnly'],
    authKeys: ['', 'subject'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}
