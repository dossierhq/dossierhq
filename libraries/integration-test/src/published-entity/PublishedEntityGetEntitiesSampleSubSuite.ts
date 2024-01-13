import { AdminSchema, copyEntity } from '@dossierhq/core';
import { assertOkResult } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  REFERENCES_CREATE,
  TITLE_ONLY_CREATE,
  adminToPublishedEntity,
} from '../shared-entity/Fixtures.js';
import {
  assertSampledEntities,
  assertSampledEntitiesArePartOfExpected,
} from '../shared-entity/SampleTestUtils.js';
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
  clientProvider,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await clientProvider.publishedClient().getEntitiesSample({
    entityTypes: ['ReadOnly'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function getEntitiesSample_authKeySubject({
  clientProvider,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities(['subject']);
  const result = await clientProvider.publishedClient().getEntitiesSample({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function getEntitiesSample_authKeyNoneAndSubject({
  clientProvider,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities([
    'none',
    'subject',
  ]);
  const result = await clientProvider.publishedClient().getEntitiesSample({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function getEntitiesSample_linksToOneReference({
  clientProvider,
}: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const adminSchema = new AdminSchema((await adminClient.getSchemaSpecification()).valueOrThrow());

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

async function getEntitiesSample_linksToNoReferences({
  clientProvider,
}: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(titleOnlyResult);
  const {
    entity: { id },
  } = titleOnlyResult.value;

  const sampleResult = await publishedClient.getEntitiesSample({ linksTo: { id } }, { seed: 987 });
  assertSampledEntities(sampleResult, 987, []);
}

async function getEntitiesSample_linksToTwoReferencesFromOneEntity({
  clientProvider,
}: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const adminSchema = new AdminSchema((await adminClient.getSchemaSpecification()).valueOrThrow());

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
  clientProvider,
}: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const adminSchema = new AdminSchema((await adminClient.getSchemaSpecification()).valueOrThrow());

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

async function getEntitiesSample_linksFromNoReferences({
  clientProvider,
}: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

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
  clientProvider,
}: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const adminSchema = new AdminSchema((await adminClient.getSchemaSpecification()).valueOrThrow());

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
