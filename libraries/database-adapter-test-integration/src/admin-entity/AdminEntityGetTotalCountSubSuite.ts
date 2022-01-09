import { assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { getMainPrincipalReadOnlyAdminEntities } from '../shared-entity/ReadOnlyUtils';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

export const GetTotalCountSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getTotalCount_minimal,
];

async function getTotalCount_minimal({ server }: AdminEntityTestContext) {
  const setupResult = await getMainPrincipalReadOnlyAdminEntities(server);
  assertOkResult(setupResult);
  const expectedEntities = setupResult.value;
  const result = await adminClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
  });
  assertResultValue(result, expectedEntities.length);
}
