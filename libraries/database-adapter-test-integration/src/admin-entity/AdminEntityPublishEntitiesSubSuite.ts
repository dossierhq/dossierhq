import { AdminEntityStatus, copyEntity, CoreTestUtils } from '@jonasb/datadata-core';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

const { expectOkResult, expectResultValue } = CoreTestUtils;

export const PublishEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  publishEntities_minimal,
];

async function publishEntities_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity({
    info: {
      type: 'TitleOnly',
      name: 'TitleOnly name',
      authKey: 'none',
    },
    fields: { title: 'Hello' },
  });
  if (expectOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { version },
      },
    } = createResult.value;

    const publishResult = await client.publishEntities([{ id, version }]);
    if (expectOkResult(publishResult)) {
      const [{ updatedAt }] = publishResult.value;
      expectResultValue(publishResult, [
        {
          id,
          effect: 'published',
          status: AdminEntityStatus.published,
          updatedAt,
        },
      ]);

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: { status: AdminEntityStatus.published, updatedAt },
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  }
}
