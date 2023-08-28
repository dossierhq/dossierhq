import { copyEntity } from '@dossierhq/core';
import { assertOkResult } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  adminToPublishedEntity,
  REFERENCES_CREATE,
  TITLE_ONLY_CREATE,
} from '../shared-entity/Fixtures.js';
import {
  assertSampledEntities,
  assertSampledEntitiesArePartOfExpected,
} from '../shared-entity/SampleTestUtils.js';
import {
  adminClientForMainPrincipal,
  publishedClientForMainPrincipal,
} from '../shared-entity/TestClients.js';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite.js';

export const GetEntitiesSampleSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  getEntitiesSample_minimal,
  getEntitiesSample_authKeySubject,
  getEntitiesSample_authKeyNoneAndSubject,
  getEntitiesSample_linksToOneReference,
  getEntitiesSample_linksToNoReferences,
  getEntitiesSample_linksToTwoReferencesFromOneEntity,
  getEntitiesSample_linksFromOneReference,
  getEntitiesSample_linksFromNoReferences,
  getEntitiesSample_linksFromTwoReferencesFromOneEntity,
];

async function getEntitiesSample_minimal({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).getEntitiesSample({
    entityTypes: ['ReadOnly'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function getEntitiesSample_authKeySubject({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities(['subject']);
  const result = await publishedClientForMainPrincipal(server).getEntitiesSample({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function getEntitiesSample_authKeyNoneAndSubject({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities([
    'none',
    'subject',
  ]);
  const result = await publishedClientForMainPrincipal(server).getEntitiesSample({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function getEntitiesSample_linksToOneReference({
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

  const sampleResult = await publishedClient.getEntitiesSample(
    { linksTo: { id: titleOnlyId } },
    { seed: 505 },
  );
  assertSampledEntities(sampleResult, 505, [adminToPublishedEntity(adminSchema, referenceEntity)]);
}

async function getEntitiesSample_linksToNoReferences({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(titleOnlyResult);
  const {
    entity: { id },
  } = titleOnlyResult.value;

  const sampleResult = await publishedClient.getEntitiesSample({ linksTo: { id } }, { seed: 987 });
  assertSampledEntities(sampleResult, 987, []);
}

async function getEntitiesSample_linksToTwoReferencesFromOneEntity({
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

  const sampleResult = await publishedClient.getEntitiesSample(
    { linksTo: { id: titleOnlyId } },
    { seed: 765 },
  );
  assertSampledEntities(sampleResult, 765, [adminToPublishedEntity(adminSchema, referenceEntity)]);
}

async function getEntitiesSample_linksFromOneReference({
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

  const sampleResult = await publishedClient.getEntitiesSample(
    { linksFrom: { id: referenceId } },
    { seed: 432 },
  );
  assertSampledEntities(sampleResult, 432, [adminToPublishedEntity(adminSchema, titleOnlyEntity)]);
}

async function getEntitiesSample_linksFromNoReferences({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const referenceResult = await adminClient.createEntity(REFERENCES_CREATE, { publish: true });
  assertOkResult(referenceResult);
  const {
    entity: { id },
  } = referenceResult.value;

  const sampleResult = await publishedClient.getEntitiesSample(
    { linksFrom: { id } },
    { seed: 100 },
  );
  assertSampledEntities(sampleResult, 100, []);
}

async function getEntitiesSample_linksFromTwoReferencesFromOneEntity({
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

  const sampleResult = await publishedClient.getEntitiesSample(
    { linksFrom: { id: referenceId } },
    { seed: 555 },
  );
  assertSampledEntities(sampleResult, 555, [adminToPublishedEntity(adminSchema, titleOnlyEntity)]);
}
