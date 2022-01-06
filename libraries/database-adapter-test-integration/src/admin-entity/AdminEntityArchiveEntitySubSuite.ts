import { AdminEntityStatus, copyEntity } from '@jonasb/datadata-core';
import { assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures';

export const ArchiveEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  archiveEntity_minimal,
];

async function archiveEntity_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const archiveResult = await client.archiveEntity({ id });
  assertOkResult(archiveResult);
  const { updatedAt } = archiveResult.value;
  assertResultValue(archiveResult, {
    id,
    effect: 'archived',
    status: AdminEntityStatus.archived,
    updatedAt,
  });

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: { status: AdminEntityStatus.archived, updatedAt },
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}
