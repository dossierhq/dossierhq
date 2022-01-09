import { assertOkResult, assertSame } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
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

  const result = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 500 }
  );
  assertOkResult(result);
  assertSame(result.value?.edges.length, expectedEntities.length);
}

async function searchEntities_subjectAuthKey({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities(['subject']);

  const result = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'], authKeys: ['subject'] },
    { first: 500 }
  );
  assertOkResult(result);
  assertSame(result.value?.edges.length, expectedEntities.length);
}

async function searchEntities_noneAndSubjectAuthKeys({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities([
    'none',
    'subject',
  ]);

  const result = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'], authKeys: ['none', 'subject'] },
    { first: 750 }
  );
  assertOkResult(result);
  assertSame(result.value?.edges.length, expectedEntities.length);
}
