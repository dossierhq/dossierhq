import { AdminEntityStatus, copyEntity } from '@dossierhq/core';
import { assertOkResult, assertResultValue, assertTruthy } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  LOCATIONS_CREATE,
  REFERENCES_CREATE,
  TITLE_ONLY_CREATE,
} from '../shared-entity/Fixtures.js';
import { randomBoundingBox } from '../shared-entity/LocationTestUtils.js';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const GetEntitiesTotalCountSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getEntitiesTotalCount_minimal,
  getEntitiesTotalCount_authKeySubject,
  getEntitiesTotalCount_authKeyNoneAndSubject,
  getEntitiesTotalCount_statusDraft,
  getEntitiesTotalCount_statusPublished,
  getEntitiesTotalCount_statusModified,
  getEntitiesTotalCount_statusWithdrawn,
  getEntitiesTotalCount_statusArchived,
  getEntitiesTotalCount_statusDraftArchived,
  getEntitiesTotalCount_statusModifiedPublished,
  getEntitiesTotalCount_statusAll,
  getEntitiesTotalCount_linksToOneReference,
  getEntitiesTotalCount_linksToNoReferences,
  getEntitiesTotalCount_linksToTwoReferencesFromOneEntity,
  getEntitiesTotalCount_linksFromOneReference,
  getEntitiesTotalCount_linksFromNoReferences,
  getEntitiesTotalCount_linksFromTwoReferencesFromOneEntity,
  getEntitiesTotalCount_boundingBoxOneInside,
];

async function getEntitiesTotalCount_minimal({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_authKeySubject({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities(['subject']);
  const result = await adminClientForMainPrincipal(server).getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_authKeyNoneAndSubject({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities([
    'none',
    'subject',
  ]);
  const result = await adminClientForMainPrincipal(server).getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusDraft({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.draft);
  const result = await adminClientForMainPrincipal(server).getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.draft],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusPublished({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.published);
  const result = await adminClientForMainPrincipal(server).getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.published],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusModified({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.modified);
  const result = await adminClientForMainPrincipal(server).getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.modified],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusWithdrawn({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.withdrawn);
  const result = await adminClientForMainPrincipal(server).getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.withdrawn],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusArchived({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.archived);
  const result = await adminClientForMainPrincipal(server).getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.archived],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusDraftArchived({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter(
      (it) =>
        it.info.status === AdminEntityStatus.draft || it.info.status === AdminEntityStatus.archived,
    );
  const result = await adminClientForMainPrincipal(server).getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.draft, AdminEntityStatus.archived],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusModifiedPublished({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter(
      (it) =>
        it.info.status === AdminEntityStatus.modified ||
        it.info.status === AdminEntityStatus.published,
    );
  const result = await adminClientForMainPrincipal(server).getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.modified, AdminEntityStatus.published],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusAll({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [
      AdminEntityStatus.draft,
      AdminEntityStatus.modified,
      AdminEntityStatus.published,
      AdminEntityStatus.withdrawn,
      AdminEntityStatus.archived,
    ],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_linksToOneReference({ server }: AdminEntityTestContext) {
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

  const totalResult = await adminClient.getEntitiesTotalCount({ linksTo: { id: titleOnlyId } });
  assertResultValue(totalResult, 1);
}

async function getEntitiesTotalCount_linksToNoReferences({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const totalResult = await adminClient.getEntitiesTotalCount({ linksTo: { id: titleOnlyId } });
  assertResultValue(totalResult, 0);
}

async function getEntitiesTotalCount_linksToTwoReferencesFromOneEntity({
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

  const totalResult = await adminClient.getEntitiesTotalCount({ linksTo: { id: titleOnlyId } });
  assertResultValue(totalResult, 1);
}

async function getEntitiesTotalCount_linksFromOneReference({ server }: AdminEntityTestContext) {
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
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const totalResult = await adminClient.getEntitiesTotalCount({ linksFrom: { id: referenceId } });
  assertResultValue(totalResult, 1);
}

async function getEntitiesTotalCount_linksFromNoReferences({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const referenceResult = await adminClient.createEntity(REFERENCES_CREATE);
  assertOkResult(referenceResult);
  const {
    entity: { id },
  } = referenceResult.value;

  const totalResult = await adminClient.getEntitiesTotalCount({ linksFrom: { id } });
  assertResultValue(totalResult, 0);
}

async function getEntitiesTotalCount_linksFromTwoReferencesFromOneEntity({
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
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const totalResult = await adminClient.getEntitiesTotalCount({ linksFrom: { id: referenceId } });
  assertResultValue(totalResult, 1);
}

async function getEntitiesTotalCount_boundingBoxOneInside({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const boundingBox = randomBoundingBox();
  const center = {
    lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
    lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
  };
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: center } }),
  );
  assertOkResult(createResult);

  const searchResult = await adminClient.getEntities({ boundingBox }, { first: 100 });
  assertOkResult(searchResult);
  const searchCount = searchResult.value?.edges.length;
  assertTruthy(searchCount);

  const totalResult = await adminClient.getEntitiesTotalCount({ boundingBox });
  assertResultValue(totalResult, searchCount);
}
