import { CoreTestUtils, EntityPublishState } from '@jonasb/datadata-core';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

const { expectOkResult, expectResultValue } = CoreTestUtils;

export const CreateEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  createEntity_minimal,
];

async function createEntity_minimal({ client }: AdminEntityTestContext) {
  const result = await client.createEntity({
    info: {
      type: 'TitleOnly',
      name: 'TitleOnly name',
      authKey: 'none',
    },
    fields: {},
  });
  if (expectOkResult(result)) {
    const {
      entity: {
        id,
        info: { name, createdAt, updatedAt },
      },
    } = result.value;
    expectResultValue(result, {
      effect: 'created',
      entity: {
        id,
        info: {
          type: 'TitleOnly',
          name,
          version: 0,
          authKey: 'none',
          publishingState: EntityPublishState.Draft,
          createdAt,
          updatedAt,
        },
        fields: { title: null },
      },
    });
  }
}
