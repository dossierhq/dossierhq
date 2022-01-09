import { assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { publishedClientForMainPrincipal } from '../shared-entity/TestClients';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite';

export const GetTotalCountSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  totalCount_minimal,
];

async function totalCount_minimal({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
  });
  assertResultValue(result, expectedEntities.length);
}
