import type { BoundingBox } from '@dossierhq/core';
import { AdminEntityStatus, copyEntity } from '@dossierhq/core';
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
import { adminClientForMainPrincipal } from '../shared-entity/TestClients.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

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
  sampleEntities_linksToOneReference,
  sampleEntities_linksToNoReferences,
  sampleEntities_linksToTwoReferencesFromOneEntity,
  sampleEntities_linksFromOneReference,
  sampleEntities_linksFromNoReferences,
  sampleEntities_linksFromTwoReferencesFromOneEntity,
  sampleEntities_boundingBoxOneInside,
  sampleEntities_boundingBoxOneEntityTwoLocationsInside,
  sampleEntities_boundingBoxOneOutside,
  sampleEntities_boundingBoxWrappingMaxMinLongitude,
  sampleEntities_textIncludedAfterCreation,
  sampleEntities_textIncludedAfterUpdate,
  sampleEntities_textExcludedAfterUpdate,
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
    result.value.items,
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
    result.value.items,
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
    result.value.items,
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
    result.value.items,
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
    result.value.items,
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

async function sampleEntities_linksToOneReference({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const referenceResult = await adminClient.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { titleOnly: { id: titleOnlyId } } }),
  );
  assertOkResult(referenceResult);

  const sampleResult = await adminClient.sampleEntities(
    { linksTo: { id: titleOnlyId } },
    { seed: 123 },
  );
  assertSampledEntities(sampleResult, 123, [referenceResult.value.entity]);
}

async function sampleEntities_linksToNoReferences({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const sampleResult = await adminClient.sampleEntities(
    { linksTo: { id: titleOnlyId } },
    { seed: 456 },
  );
  assertSampledEntities(sampleResult, 456, []);
}

async function sampleEntities_linksToTwoReferencesFromOneEntity({
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
    }),
  );
  assertOkResult(referenceResult);

  const sampleResult = await adminClient.sampleEntities(
    { linksTo: { id: titleOnlyId } },
    { seed: 789 },
  );
  assertSampledEntities(sampleResult, 789, [referenceResult.value.entity]);
}

async function sampleEntities_linksFromOneReference({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
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

  const sampleResult = await adminClient.sampleEntities(
    { linksFrom: { id: referenceId } },
    { seed: 123 },
  );
  assertSampledEntities(sampleResult, 123, [titleEntity]);
}

async function sampleEntities_linksFromNoReferences({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const referenceResult = await adminClient.createEntity(REFERENCES_CREATE);
  assertOkResult(referenceResult);
  const {
    entity: { id },
  } = referenceResult.value;

  const sampleResult = await adminClient.sampleEntities({ linksFrom: { id } }, { seed: 456 });
  assertSampledEntities(sampleResult, 456, []);
}

async function sampleEntities_linksFromTwoReferencesFromOneEntity({
  server,
}: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
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

  const sampleResult = await adminClient.sampleEntities(
    { linksFrom: { id: referenceId } },
    { seed: 789 },
  );
  assertSampledEntities(sampleResult, 789, [titleOnlyEntity]);
}

async function sampleEntities_boundingBoxOneInside({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
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

  const sampleResult = await adminClient.sampleEntities(
    {
      boundingBox,
      linksFrom: { id: referenceId },
    },
    { seed: 123 },
  );
  assertSampledEntities(sampleResult, 123, [locationsEntity]);
}

async function sampleEntities_boundingBoxOneEntityTwoLocationsInside({
  server,
}: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
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

  const sampleResult = await adminClient.sampleEntities(
    { boundingBox, linksFrom: { id: referenceId } },
    { seed: 321 },
  );
  assertSampledEntities(sampleResult, 321, [{ id }]);
}

async function sampleEntities_boundingBoxOneOutside({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
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

  const sampleResult = await adminClient.sampleEntities(
    {
      boundingBox,
      linksFrom: { id: referenceId },
    },
    { seed: 123 },
  );
  assertSampledEntities(sampleResult, 123, []);
}

async function sampleEntities_boundingBoxWrappingMaxMinLongitude({
  server,
}: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
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

  const sampleResult = await adminClient.sampleEntities(
    { boundingBox, linksFrom: { id: referenceId } },
    { seed: 321 },
  );
  assertSampledEntities(sampleResult, 321, [locationsEntity]);
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

async function sampleEntities_textIncludedAfterCreation({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
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

  const sampleResult = await adminClient.sampleEntities(
    { text: 'serious storytelling', linksFrom: { id: referenceId } },
    { seed: 111 },
  );
  assertSampledEntities(sampleResult, 111, [titleOnlyEntity]);
}

async function sampleEntities_textIncludedAfterUpdate({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
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
    await adminClient.sampleEntities(
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
    await adminClient.sampleEntities(
      { text: 'lightning strikes', linksFrom: { id: referenceId } },
      { seed: 123 },
    ),
    123,
    [{ id }],
  );
}

async function sampleEntities_textExcludedAfterUpdate({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
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
    await adminClient.sampleEntities(
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
    await adminClient.sampleEntities(
      { text: 'bear eating', linksFrom: { id: referenceId } },
      { seed: 123 },
    ),
    123,
    [],
  );
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
