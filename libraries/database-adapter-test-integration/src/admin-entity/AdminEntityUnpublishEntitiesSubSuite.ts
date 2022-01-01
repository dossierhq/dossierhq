import { AdminEntityStatus, copyEntity, CoreTestUtils } from '@jonasb/datadata-core';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE } from './Fixtures';

const { expectOkResult, expectResultValue } = CoreTestUtils;

export const UnpublishEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  unpublishEntities_minimal,
];

async function unpublishEntities_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE, { publish: true });
  if (expectOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;

    const unpublishResult = await client.unpublishEntities([{ id }]);
    if (expectOkResult(unpublishResult)) {
      const [{ updatedAt }] = unpublishResult.value;
      expectResultValue(unpublishResult, [
        {
          id,
          effect: 'unpublished',
          status: AdminEntityStatus.withdrawn,
          updatedAt,
        },
      ]);

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: { status: AdminEntityStatus.withdrawn, updatedAt },
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  }
}
