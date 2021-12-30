import type { AdminEntity, AdminEntityCreate } from '@jonasb/datadata-core';
import { AdminEntityStatus, copyEntity, CoreTestUtils, ErrorType } from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import { v4 as uuidv4 } from 'uuid';
import { assertNotSame, assertTruthy } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

const { expectErrorResult, expectOkResult, expectResultValue } = CoreTestUtils;

const TITLE_ONLY_CREATE: Readonly<AdminEntityCreate> = {
  info: {
    type: 'TitleOnly',
    name: 'TitleOnly name',
    authKey: 'none',
  },
  fields: { title: 'Title' },
};

const TITLE_ONLY_ENTITY: Readonly<AdminEntity> = {
  id: 'REPLACE',
  info: {
    type: 'TitleOnly',
    name: 'TitleOnly name',
    version: 0,
    authKey: 'none',
    status: AdminEntityStatus.draft,
    createdAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
    updatedAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
  },
  fields: { title: 'Title' },
};

export const CreateEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  createEntity_minimal,
  createEntity_withId,
  createEntity_duplicateName,
  createEntity_publishMinimal,
  createEntity_errorPublishWithoutRequiredTitle,
];

async function createEntity_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (expectOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { name, createdAt, updatedAt },
      },
    } = createResult.value;

    const expectedEntity = copyEntity(TITLE_ONLY_ENTITY, {
      id,
      info: {
        name,
        createdAt,
        updatedAt,
      },
    });

    expectResultValue(createResult, {
      effect: 'created',
      entity: expectedEntity,
    });

    const getResult = await client.getEntity({ id });
    expectResultValue(getResult, expectedEntity);
  }
}

async function createEntity_withId({ client }: AdminEntityTestContext) {
  const id = uuidv4();
  const createResult = await client.createEntity(copyEntity(TITLE_ONLY_CREATE, { id }));
  if (expectOkResult(createResult)) {
    const {
      entity: {
        info: { name, createdAt, updatedAt },
      },
    } = createResult.value;

    const expectedEntity = copyEntity(TITLE_ONLY_ENTITY, {
      id,
      info: {
        name,
        createdAt,
        updatedAt,
      },
    });

    expectResultValue(createResult, {
      effect: 'created',
      entity: expectedEntity,
    });

    const getResult = await client.getEntity({ id });
    expectResultValue(getResult, expectedEntity);
  }
}

async function createEntity_duplicateName({ client }: AdminEntityTestContext) {
  const firstResult = await client.createEntity(TITLE_ONLY_CREATE);
  const secondResult = await client.createEntity(TITLE_ONLY_CREATE);
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

    assertTruthy(secondName.match(/^TitleOnly name#\d{8}$/));
  }
}

async function createEntity_publishMinimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE, { publish: true });
  if (expectOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { name, createdAt, updatedAt },
      },
    } = createResult.value;

    const expectedEntity = copyEntity(TITLE_ONLY_ENTITY, {
      id,
      info: {
        name,
        status: AdminEntityStatus.published,
        createdAt,
        updatedAt,
      },
    });

    expectResultValue(createResult, {
      effect: 'created',
      entity: expectedEntity,
    });

    const getResult = await client.getEntity({ id });
    expectResultValue(getResult, expectedEntity);
  }
}

async function createEntity_errorPublishWithoutRequiredTitle({ client }: AdminEntityTestContext) {
  const id = uuidv4();
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { id, fields: { title: null } }),
    { publish: true }
  );
  expectErrorResult(
    createResult,
    ErrorType.BadRequest,
    `entity(${id}).fields.title: Required field is empty`
  );

  const getResult = await client.getEntity({ id });
  expectErrorResult(getResult, ErrorType.NotFound, 'No such entity');
}
