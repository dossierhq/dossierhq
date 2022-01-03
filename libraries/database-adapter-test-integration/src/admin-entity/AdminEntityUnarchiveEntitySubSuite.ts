import { AdminEntityStatus, copyEntity } from '@jonasb/datadata-core';
import { assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures';

export const UnarchiveEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  unarchiveEntity_minimal,
];

async function unarchiveEntity_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (assertOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;

    const archiveResult = await client.archiveEntity({ id });
    assertOkResult(archiveResult);

    const unarchiveResult = await client.unarchiveEntity({ id });
    if (assertOkResult(unarchiveResult)) {
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
  }
}
