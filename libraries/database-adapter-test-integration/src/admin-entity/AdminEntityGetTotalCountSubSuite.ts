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

export const GetTotalCountSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getTotalCount_minimal,
  getTotalCount_authKeySubject,
  getTotalCount_authKeyNoneAndSubject,
  getTotalCount_statusDraft,
  getTotalCount_statusPublished,
  getTotalCount_statusModified,
  getTotalCount_statusWithdrawn,
  getTotalCount_statusArchived,
  getTotalCount_statusDraftArchived,
  getTotalCount_statusModifiedPublished,
  getTotalCount_statusAll,
  getTotalCount_linksToOneReference,
  getTotalCount_linksToNoReferences,
  getTotalCount_linksToTwoReferencesFromOneEntity,
  getTotalCount_linksFromOneReference,
  getTotalCount_linksFromNoReferences,
  getTotalCount_linksFromTwoReferencesFromOneEntity,
  getTotalCount_boundingBoxOneInside,
];

async function getTotalCount_minimal({ server, readOnlyEntityRepository }: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getTotalCount_authKeySubject({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities(['subject']);
  const result = await adminClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getTotalCount_authKeyNoneAndSubject({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities([
    'none',
    'subject',
  ]);
  const result = await adminClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getTotalCount_statusDraft({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.draft);
  const result = await adminClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.draft],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getTotalCount_statusPublished({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.published);
  const result = await adminClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.published],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getTotalCount_statusModified({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.modified);
  const result = await adminClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.modified],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getTotalCount_statusWithdrawn({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.withdrawn);
  const result = await adminClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.withdrawn],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getTotalCount_statusArchived({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.archived);
  const result = await adminClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.archived],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getTotalCount_statusDraftArchived({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter(
      (it) =>
        it.info.status === AdminEntityStatus.draft || it.info.status === AdminEntityStatus.archived
    );
  const result = await adminClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.draft, AdminEntityStatus.archived],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getTotalCount_statusModifiedPublished({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter(
      (it) =>
        it.info.status === AdminEntityStatus.modified ||
        it.info.status === AdminEntityStatus.published
    );
  const result = await adminClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.modified, AdminEntityStatus.published],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getTotalCount_statusAll({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).getTotalCount({
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

async function getTotalCount_linksToOneReference({ server }: AdminEntityTestContext) {
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

  const totalResult = await adminClient.getTotalCount({ linksTo: { id: titleOnlyId } });
  assertResultValue(totalResult, 1);
}

async function getTotalCount_linksToNoReferences({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const totalResult = await adminClient.getTotalCount({ linksTo: { id: titleOnlyId } });
  assertResultValue(totalResult, 0);
}

async function getTotalCount_linksToTwoReferencesFromOneEntity({ server }: AdminEntityTestContext) {
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

  const totalResult = await adminClient.getTotalCount({ linksTo: { id: titleOnlyId } });
  assertResultValue(totalResult, 1);
}

async function getTotalCount_linksFromOneReference({ server }: AdminEntityTestContext) {
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
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const totalResult = await adminClient.getTotalCount({ linksFrom: { id: referenceId } });
  assertResultValue(totalResult, 1);
}

async function getTotalCount_linksFromNoReferences({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const referenceResult = await adminClient.createEntity(REFERENCES_CREATE);
  assertOkResult(referenceResult);
  const {
    entity: { id },
  } = referenceResult.value;

  const totalResult = await adminClient.getTotalCount({ linksFrom: { id } });
  assertResultValue(totalResult, 0);
}

async function getTotalCount_linksFromTwoReferencesFromOneEntity({
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
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const totalResult = await adminClient.getTotalCount({ linksFrom: { id: referenceId } });
  assertResultValue(totalResult, 1);
}

async function getTotalCount_boundingBoxOneInside({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const boundingBox = randomBoundingBox();
  const center = {
    lat: (boundingBox.minLat + boundingBox.maxLat) / 2,
    lng: (boundingBox.minLng + boundingBox.maxLng) / 2,
  };
  const createResult = await adminClient.createEntity(
    copyEntity(LOCATIONS_CREATE, { fields: { location: center } })
  );
  assertOkResult(createResult);

  const searchResult = await adminClient.searchEntities({ boundingBox }, { first: 100 });
  assertOkResult(searchResult);
  const searchCount = searchResult.value?.edges.length;
  assertTruthy(searchCount);

  const totalResult = await adminClient.getTotalCount({ boundingBox });
  assertResultValue(totalResult, searchCount);
}
