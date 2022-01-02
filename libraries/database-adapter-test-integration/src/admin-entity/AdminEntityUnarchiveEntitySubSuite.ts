import { AdminEntityStatus, copyEntity, CoreTestUtils } from '@jonasb/datadata-core';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE } from './Fixtures';

const { expectOkResult, expectResultValue } = CoreTestUtils;

export const UnarchiveEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  unarchiveEntity_minimal,
];

async function unarchiveEntity_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (expectOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;

    const archiveResult = await client.archiveEntity({ id });
    expectOkResult(archiveResult);

    const unarchiveResult = await client.unarchiveEntity({ id });
    if (expectOkResult(unarchiveResult)) {
      const { updatedAt } = unarchiveResult.value;
      expectResultValue(unarchiveResult, {
        id,
        effect: 'unarchived',
        status: AdminEntityStatus.draft,
        updatedAt,
      });

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: { status: AdminEntityStatus.draft, updatedAt },
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  }
}
