import { AdminQueryOrder } from '@jonasb/datadata-core';
import type { UnboundTestFunction } from '../Builder';
import { assertAdminEntityConnectionToMatchSlice } from '../shared-entity/SearchTestUtils';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

export const SearchEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  searchEntities_minimal,
  searchEntities_subjectAuthKey,
  searchEntities_noneAndSubjectAuthKeys,
];

async function searchEntities_minimal({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();

  const result = await adminClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
  });
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    AdminQueryOrder.createdAt
  );
}

async function searchEntities_subjectAuthKey({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities(['subject']);

  const result = await adminClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    AdminQueryOrder.createdAt
  );
}

async function searchEntities_noneAndSubjectAuthKeys({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities([
    'none',
    'subject',
  ]);

  const result = await adminClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    result,
    0,
    25,
    AdminQueryOrder.createdAt
  );
}
