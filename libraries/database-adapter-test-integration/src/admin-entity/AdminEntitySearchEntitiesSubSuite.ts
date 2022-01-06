import { assertOkResult, assertSame } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { getReadOnlyEntities } from '../shared-entity/ReadOnlyUtils';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

export const SearchEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  searchEntities_minimal,
];

async function searchEntities_minimal({ server }: AdminEntityTestContext) {
  const setupResult = await getReadOnlyEntities(server);
  if (assertOkResult(setupResult)) {
    const readOnlyEntities = setupResult.value;
    const result = await adminClientForMainPrincipal(server).searchEntities({
      entityTypes: ['ReadOnly'],
    });
    if (assertOkResult(result)) {
      assertSame(result.value?.edges.length, readOnlyEntities.length);
    }
  }
}
