import { AdminEntityStatus, copyEntity, CoreTestUtils } from '@jonasb/datadata-core';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE } from './Fixtures';

const { expectOkResult, expectResultValue } = CoreTestUtils;

export const ArchiveEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  archiveEntity_minimal,
];

async function archiveEntity_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (expectOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;

    const archiveResult = await client.archiveEntity({ id });
    if (expectOkResult(archiveResult)) {
      const { updatedAt } = archiveResult.value;
      expectResultValue(archiveResult, {
        id,
        effect: 'archived',
        status: AdminEntityStatus.archived,
        updatedAt,
      });

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: { status: AdminEntityStatus.archived, updatedAt },
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  }
}
