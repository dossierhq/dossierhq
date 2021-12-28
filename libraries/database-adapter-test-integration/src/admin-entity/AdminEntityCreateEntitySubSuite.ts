import { CoreTestUtils, EntityPublishState } from '@jonasb/datadata-core';
import { assertNotSame, assertTruthy } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

const { expectOkResult, expectResultValue } = CoreTestUtils;

export const CreateEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  createEntity_minimal,
  createEntity_duplicateName,
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

async function createEntity_duplicateName({ client }: AdminEntityTestContext) {
  const firstResult = await client.createEntity({
    info: {
      type: 'TitleOnly',
      name: 'Name of first entity',
      authKey: 'none',
    },
    fields: {},
  });
  const secondResult = await client.createEntity({
    info: {
      type: 'TitleOnly',
      name: 'Name of first entity',
      authKey: 'none',
    },
    fields: {},
  });
  if (expectOkResult(firstResult) && expectOkResult(secondResult)) {
    const {
      entity: {
        id: firstId,
        info: { name: firstName },
      },
    } = firstResult.value;
    const {
      entity: {
        id: secondId,
        info: { name: secondName },
      },
    } = secondResult.value;
    assertNotSame(firstId, secondId);
    assertNotSame(firstName, secondName);

    assertTruthy(secondName.match(/^Name of first entity#\d{8}$/));
  }
}
