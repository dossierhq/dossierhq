import { assertOkResult, assertSame } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { getReadOnlyPublishedEntities } from '../shared-entity/ReadOnlyUtils';
import { publishedClientForMainPrincipal } from '../shared-entity/TestClients';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite';

export const SearchEntitiesSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  searchEntities_minimal,
];

async function searchEntities_minimal({ server }: PublishedEntityTestContext) {
  const setupResult = await getReadOnlyPublishedEntities(server);
  assertOkResult(setupResult);
  const readOnlyEntities = setupResult.value;
  const result = await publishedClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
  });
  assertOkResult(result);
  assertSame(result.value?.edges.length, readOnlyEntities.length);
}
