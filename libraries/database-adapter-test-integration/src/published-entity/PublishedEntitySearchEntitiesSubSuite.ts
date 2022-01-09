import { assertOkResult, assertSame } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
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
  const result = await publishedClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 500 }
  );
  assertOkResult(result);
  assertSame(result.value?.edges.length, expectedEntities.length);
}

async function searchEntities_subjectAuthKey({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities(['subject']);
  const result = await publishedClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'], authKeys: ['subject'] },
    { first: 500 }
  );
  assertOkResult(result);
  assertSame(result.value?.edges.length, expectedEntities.length);
}

async function searchEntities_noneAndSubjectAuthKeys({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities([
    'none',
    'subject',
  ]);
  const result = await publishedClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'], authKeys: ['none', 'subject'] },
    { first: 500 }
  );
  assertOkResult(result);
  assertSame(result.value?.edges.length, expectedEntities.length);
}
