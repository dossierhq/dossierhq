import { AdminEntityStatus, copyEntity, ErrorType } from '@jonasb/datadata-core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients';

export const UnarchiveEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  unarchiveEntity_minimal,
  unarchiveEntity_errorInvalidId,
];

async function unarchiveEntity_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const archiveResult = await client.archiveEntity({ id });
  assertOkResult(archiveResult);

  const unarchiveResult = await client.unarchiveEntity({ id });
  assertOkResult(unarchiveResult);
  const { updatedAt } = unarchiveResult.value;
  assertResultValue(unarchiveResult, {
    id,
    effect: 'unarchived',
    status: AdminEntityStatus.draft,
    updatedAt,
  });

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: { status: AdminEntityStatus.draft, updatedAt },
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function unarchiveEntity_errorInvalidId({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).unarchiveEntity({
    id: '5b14e69f-6612-4ddb-bb42-7be273104486',
  });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}
