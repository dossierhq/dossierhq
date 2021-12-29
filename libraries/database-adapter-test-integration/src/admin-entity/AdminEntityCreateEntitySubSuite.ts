import type { AdminEntity } from '@jonasb/datadata-core';
import { CoreTestUtils, AdminEntityStatus } from '@jonasb/datadata-core';
import { assertNotSame, assertTruthy } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

const { expectOkResult, expectResultValue } = CoreTestUtils;

export const CreateEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  createEntity_minimal,
  createEntity_duplicateName,
];

async function createEntity_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity({
    info: {
      type: 'TitleOnly',
      name: 'TitleOnly name',
      authKey: 'none',
    },
    fields: {},
  });
  if (expectOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { name, createdAt, updatedAt },
      },
    } = createResult.value;

    const expectedEntity: AdminEntity = {
      id,
      info: {
        type: 'TitleOnly',
        name,
        version: 0,
        authKey: 'none',
        status: AdminEntityStatus.Draft,
        createdAt,
        updatedAt,
      },
      fields: { title: null },
    };

    expectResultValue(createResult, {
      effect: 'created',
      entity: expectedEntity,
    });

    const getResult = await client.getEntity({ id });
    expectResultValue(getResult, expectedEntity);
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
