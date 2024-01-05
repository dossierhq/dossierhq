import { AdminEntityStatus, copyEntity } from '@dossierhq/core';
import { assertOkResult, assertResultValue, assertTruthy } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  LOCATIONS_CREATE,
  REFERENCES_CREATE,
  TITLE_ONLY_CREATE,
} from '../shared-entity/Fixtures.js';
import { randomBoundingBox } from '../shared-entity/LocationTestUtils.js';
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
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await clientProvider.adminClient().getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_authKeySubject({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities(['subject']);
  const result = await clientProvider.adminClient().getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_authKeyNoneAndSubject({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities([
    'none',
    'subject',
  ]);
  const result = await clientProvider.adminClient().getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusDraft({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.draft);
  const result = await clientProvider.adminClient().getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.draft],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusPublished({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.published);
  const result = await clientProvider.adminClient().getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.published],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusModified({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.modified);
  const result = await clientProvider.adminClient().getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.modified],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusWithdrawn({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.withdrawn);
  const result = await clientProvider.adminClient().getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.withdrawn],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusArchived({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter((it) => it.info.status === AdminEntityStatus.archived);
  const result = await clientProvider.adminClient().getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.archived],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusDraftArchived({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter(
      (it) =>
        it.info.status === AdminEntityStatus.draft || it.info.status === AdminEntityStatus.archived,
    );
  const result = await clientProvider.adminClient().getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.draft, AdminEntityStatus.archived],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusModifiedPublished({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository
    .getMainPrincipalAdminEntities()
    .filter(
      (it) =>
        it.info.status === AdminEntityStatus.modified ||
        it.info.status === AdminEntityStatus.published,
    );
  const result = await clientProvider.adminClient().getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    status: [AdminEntityStatus.modified, AdminEntityStatus.published],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_statusAll({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await clientProvider.adminClient().getEntitiesTotalCount({
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

async function getEntitiesTotalCount_linksToOneReference({
  clientProvider,
}: AdminEntityTestContext) {
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

  const totalResult = await adminClient.getEntitiesTotalCount({ linksTo: { id: titleOnlyId } });
  assertResultValue(totalResult, 1);
}

async function getEntitiesTotalCount_linksToNoReferences({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const titleOnlyResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(titleOnlyResult);
  const {
    entity: { id: titleOnlyId },
  } = titleOnlyResult.value;

  const totalResult = await adminClient.getEntitiesTotalCount({ linksTo: { id: titleOnlyId } });
  assertResultValue(totalResult, 0);
}

async function getEntitiesTotalCount_linksToTwoReferencesFromOneEntity({
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

  const totalResult = await adminClient.getEntitiesTotalCount({ linksTo: { id: titleOnlyId } });
  assertResultValue(totalResult, 1);
}

async function getEntitiesTotalCount_linksFromOneReference({
  clientProvider,
}: AdminEntityTestContext) {
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
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const totalResult = await adminClient.getEntitiesTotalCount({ linksFrom: { id: referenceId } });
  assertResultValue(totalResult, 1);
}

async function getEntitiesTotalCount_linksFromNoReferences({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const referenceResult = await adminClient.createEntity(REFERENCES_CREATE);
  assertOkResult(referenceResult);
  const {
    entity: { id },
  } = referenceResult.value;

  const totalResult = await adminClient.getEntitiesTotalCount({ linksFrom: { id } });
  assertResultValue(totalResult, 0);
}

async function getEntitiesTotalCount_linksFromTwoReferencesFromOneEntity({
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
  const {
    entity: { id: referenceId },
  } = referenceResult.value;

  const totalResult = await adminClient.getEntitiesTotalCount({ linksFrom: { id: referenceId } });
  assertResultValue(totalResult, 1);
}

async function getEntitiesTotalCount_boundingBoxOneInside({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
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
