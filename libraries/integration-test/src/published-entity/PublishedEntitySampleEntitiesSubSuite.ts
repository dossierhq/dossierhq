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

export const SampleEntitiesSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  sampleEntities_minimal,
  sampleEntities_authKeySubject,
  sampleEntities_authKeyNoneAndSubject,
  sampleEntities_linksToOneReference,
  sampleEntities_linksToNoReferences,
  sampleEntities_linksToTwoReferencesFromOneEntity,
  sampleEntities_linksFromOneReference,
  sampleEntities_linksFromNoReferences,
  sampleEntities_linksFromTwoReferencesFromOneEntity,
];

async function sampleEntities_minimal({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function sampleEntities_authKeySubject({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities(['subject']);
  const result = await publishedClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function sampleEntities_authKeyNoneAndSubject({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities([
    'none',
    'subject',
  ]);
  const result = await publishedClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function sampleEntities_linksToOneReference({
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
    { publish: true }
  );
  assertOkResult(referenceResult);
  const { entity: referenceEntity } = referenceResult.value;

  const sampleResult = await publishedClient.sampleEntities(
    { linksTo: { id: titleOnlyId } },
    { seed: 505 }
  );
  assertSampledEntities(sampleResult, 505, [adminToPublishedEntity(adminSchema, referenceEntity)]);
}

async function sampleEntities_linksToNoReferences({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(titleOnlyResult);
  const {
    entity: { id },
  } = titleOnlyResult.value;

  const sampleResult = await publishedClient.sampleEntities({ linksTo: { id } }, { seed: 987 });
  assertSampledEntities(sampleResult, 987, []);
}

async function sampleEntities_linksToTwoReferencesFromOneEntity({
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
    { publish: true }
  );
  assertOkResult(referenceResult);
  const { entity: referenceEntity } = referenceResult.value;

  const sampleResult = await publishedClient.sampleEntities(
    { linksTo: { id: titleOnlyId } },
    { seed: 765 }
  );
  assertSampledEntities(sampleResult, 765, [adminToPublishedEntity(adminSchema, referenceEntity)]);
}

async function sampleEntities_linksFromOneReference({
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
    { publish: true }
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const sampleResult = await publishedClient.sampleEntities(
    { linksFrom: { id: referenceId } },
    { seed: 432 }
  );
  assertSampledEntities(sampleResult, 432, [adminToPublishedEntity(adminSchema, titleOnlyEntity)]);
}

async function sampleEntities_linksFromNoReferences({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const referenceResult = await adminClient.createEntity(REFERENCES_CREATE, { publish: true });
  assertOkResult(referenceResult);
  const {
    entity: { id },
  } = referenceResult.value;

  const sampleResult = await publishedClient.sampleEntities({ linksFrom: { id } }, { seed: 100 });
  assertSampledEntities(sampleResult, 100, []);
}

async function sampleEntities_linksFromTwoReferencesFromOneEntity({
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
    { publish: true }
  );
  assertOkResult(referenceResult);
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const sampleResult = await publishedClient.sampleEntities(
    { linksFrom: { id: referenceId } },
    { seed: 555 }
  );
  assertSampledEntities(sampleResult, 555, [adminToPublishedEntity(adminSchema, titleOnlyEntity)]);
}
