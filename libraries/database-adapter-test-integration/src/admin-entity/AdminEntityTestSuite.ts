import { CoreTestUtils, EntityPublishState, type AdminClient } from '@jonasb/datadata-core';
import type { TestFunctionInitializer, TestSuite } from '..';
import { buildSuite } from '../Builder';

const { expectOkResult, expectResultValue } = CoreTestUtils;

export function createAdminEntityTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<{ client: AdminClient }, TCleanup>
): TestSuite {
  return buildSuite(initializer, createEntity_minimal);
}

async function createEntity_minimal({ client }: { client: AdminClient }) {
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
