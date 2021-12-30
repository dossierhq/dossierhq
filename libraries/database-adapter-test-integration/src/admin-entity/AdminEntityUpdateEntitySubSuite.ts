import { copyEntity, CoreTestUtils } from '@jonasb/datadata-core';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE } from './Fixtures';

const { expectOkResult, expectResultValue } = CoreTestUtils;

export const UpdateEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  updateEntity_minimal,
];

async function updateEntity_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (expectOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;
    const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });
    if (expectOkResult(updateResult)) {
      const {
        entity: {
          info: { updatedAt },
        },
      } = updateResult.value;

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: {
          updatedAt,
          version: 1,
        },
        fields: {
          title: 'Updated title',
        },
      });

      expectResultValue(updateResult, {
        effect: 'updated',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  }
}
