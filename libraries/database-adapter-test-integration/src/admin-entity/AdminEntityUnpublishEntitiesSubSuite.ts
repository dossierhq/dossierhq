import { AdminEntityStatus, copyEntity } from '@jonasb/datadata-core';
import { assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures';

export const UnpublishEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  unpublishEntities_minimal,
];

async function unpublishEntities_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const unpublishResult = await client.unpublishEntities([{ id }]);
  assertOkResult(unpublishResult);
  const [{ updatedAt }] = unpublishResult.value;
  assertResultValue(unpublishResult, [
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
  assertResultValue(getResult, expectedEntity);
}
