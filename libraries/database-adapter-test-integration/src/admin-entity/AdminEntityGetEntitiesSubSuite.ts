import type { AdminEntity, ErrorType } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import { assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

export const GetEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getEntities_minimal,
];

async function getEntities_minimal({ client }: AdminEntityTestContext) {
  const create1Result = await client.createEntity(TITLE_ONLY_CREATE);
  const create2Result = await client.createEntity(TITLE_ONLY_CREATE);
  if (assertOkResult(create1Result) && assertOkResult(create2Result)) {
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
}
