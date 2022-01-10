import { PublishedQueryOrder } from '@jonasb/datadata-core';
import type { UnboundTestFunction } from '../Builder';
import { assertPublishedEntityConnectionToMatchSlice } from '../shared-entity/SearchTestUtils';
import { publishedClientForMainPrincipal } from '../shared-entity/TestClients';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite';

export const SearchEntitiesSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  searchEntities_minimal,
  searchEntities_subjectAuthKey,
  searchEntities_noneAndSubjectAuthKeys,
];

async function searchEntities_minimal({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
  });
  assertPublishedEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    PublishedQueryOrder.createdAt
  );
}

async function searchEntities_subjectAuthKey({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities(['subject']);
  const result = await publishedClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertPublishedEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    PublishedQueryOrder.createdAt
  );
}

async function searchEntities_noneAndSubjectAuthKeys({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities([
    'none',
    'subject',
  ]);
  const result = await publishedClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertPublishedEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    PublishedQueryOrder.createdAt
  );
}
