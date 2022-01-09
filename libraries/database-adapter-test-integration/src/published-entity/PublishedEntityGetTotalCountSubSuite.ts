import { assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { getMainPrincipalReadOnlyPublishedEntities } from '../shared-entity/ReadOnlyUtils';
import { publishedClientForMainPrincipal } from '../shared-entity/TestClients';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite';

export const GetTotalCountSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  totalCount_minimal,
];

async function totalCount_minimal({ server }: PublishedEntityTestContext) {
  const setupResult = await getMainPrincipalReadOnlyPublishedEntities(server);
  assertOkResult(setupResult);
  const expectedEntities = setupResult.value;
  const result = await publishedClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
  });
  assertResultValue(result, expectedEntities.length);
}
