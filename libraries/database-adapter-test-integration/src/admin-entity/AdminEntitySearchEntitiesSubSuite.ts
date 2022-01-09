import { assertOkResult, assertSame } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { getMainPrincipalReadOnlyAdminEntities } from '../shared-entity/ReadOnlyUtils';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

export const SearchEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  searchEntities_minimal,
];

async function searchEntities_minimal({ server }: AdminEntityTestContext) {
  const setupResult = await getMainPrincipalReadOnlyAdminEntities(server);
  assertOkResult(setupResult);
  const expectedEntities = setupResult.value;

  const result = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 100 }
  );
  assertOkResult(result);
  assertSame(result.value?.edges.length, expectedEntities.length);
}
