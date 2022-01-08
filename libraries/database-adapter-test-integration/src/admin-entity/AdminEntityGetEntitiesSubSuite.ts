import type { AdminEntity } from '@jonasb/datadata-core';
import { ErrorType, ok } from '@jonasb/datadata-core';
import { assertErrorResult, assertOkResult, assertResultValue, assertSame } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

export const GetEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getEntities_minimal,
  getEntities_errorMissingIds,
];

async function getEntities_minimal({ client }: AdminEntityTestContext) {
  const create1Result = await client.createEntity(TITLE_ONLY_CREATE);
  const create2Result = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(create1Result);
  assertOkResult(create2Result);
  const {
    entity: { id: id1 },
  } = create1Result.value;
  const {
    entity: { id: id2 },
  } = create2Result.value;

  const getResult = await client.getEntities([{ id: id1 }, { id: id2 }]);
  assertResultValue(getResult, [
    ok<AdminEntity, ErrorType.Generic>(create1Result.value.entity),
    ok<AdminEntity, ErrorType.Generic>(create2Result.value.entity),
  ]);
}

async function getEntities_errorMissingIds({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).getEntities([
    { id: '13e4c7da-616e-44a3-a039-24f96f9b17da' },
    { id: '13e4c7da-616e-44a3-44a3-24f96f9b17da' },
  ]);
  assertOkResult(result);
  assertSame(result.value.length, 2);
  assertErrorResult(result.value[0], ErrorType.NotFound, 'No such entity');
  assertErrorResult(result.value[1], ErrorType.NotFound, 'No such entity');
}
