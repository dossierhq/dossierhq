import { assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { getReadOnlyPublishedEntities } from '../shared-entity/ReadOnlyUtils';
import { publishedClientForMainPrincipal } from '../shared-entity/TestClients';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite';

export const GetTotalCountSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  totalCount_minimal,
];

async function totalCount_minimal({ server }: PublishedEntityTestContext) {
  const setupResult = await getReadOnlyPublishedEntities(server);
  assertOkResult(setupResult);
  const readOnlyEntities = setupResult.value;
  const result = await publishedClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
  });
  assertResultValue(result, readOnlyEntities.length);
}
