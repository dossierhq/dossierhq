import { assertOkResult, assertSame } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { getMainPrincipalReadOnlyPublishedEntities } from '../shared-entity/ReadOnlyUtils';
import { publishedClientForMainPrincipal } from '../shared-entity/TestClients';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite';

export const SearchEntitiesSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  searchEntities_minimal,
];

async function searchEntities_minimal({ server }: PublishedEntityTestContext) {
  const setupResult = await getMainPrincipalReadOnlyPublishedEntities(server);
  assertOkResult(setupResult);
  const expectedEntities = setupResult.value;
  const result = await publishedClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
  });
  assertOkResult(result);
  assertSame(result.value?.edges.length, expectedEntities.length);
}
