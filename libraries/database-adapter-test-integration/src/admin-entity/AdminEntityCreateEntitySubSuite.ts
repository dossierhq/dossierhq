import { AdminEntityStatus, copyEntity, ErrorType } from '@jonasb/datadata-core';
import { v4 as uuidv4 } from 'uuid';
import {
  assertErrorResult,
  assertNotSame,
  assertOkResult,
  assertResultValue,
  assertTruthy,
} from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import {
  TITLE_ONLY_CREATE,
  TITLE_ONLY_ADMIN_ENTITY,
  REFERENCES_CREATE,
  REFERENCES_ADMIN_ENTITY,
} from '../shared-entity/Fixtures';

export const CreateEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  createEntity_minimal,
  createEntity_withId,
  createEntity_duplicateName,
  createEntity_publishMinimal,
  createEntity_publishWithSubjectAuthKey,
  createEntity_withTwoReferences,
  createEntity_errorPublishWithoutRequiredTitle,
];

async function createEntity_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (assertOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { name, createdAt, updatedAt },
      },
    } = createResult.value;

    const expectedEntity = copyEntity(TITLE_ONLY_ADMIN_ENTITY, {
      id,
      info: {
        name,
        createdAt,
        updatedAt,
      },
    });

    assertResultValue(createResult, {
      effect: 'created',
      entity: expectedEntity,
    });

    const getResult = await client.getEntity({ id });
    assertResultValue(getResult, expectedEntity);
  }
}

async function createEntity_withId({ client }: AdminEntityTestContext) {
  const id = uuidv4();
  const createResult = await client.createEntity(copyEntity(TITLE_ONLY_CREATE, { id }));
  if (assertOkResult(createResult)) {
    const {
      entity: {
        info: { name, createdAt, updatedAt },
      },
    } = createResult.value;

    const expectedEntity = copyEntity(TITLE_ONLY_ADMIN_ENTITY, {
      id,
      info: {
        name,
        createdAt,
        updatedAt,
      },
    });

    assertResultValue(createResult, {
      effect: 'created',
      entity: expectedEntity,
    });

    const getResult = await client.getEntity({ id });
    assertResultValue(getResult, expectedEntity);
  }
}

async function createEntity_duplicateName({ client }: AdminEntityTestContext) {
  const firstResult = await client.createEntity(TITLE_ONLY_CREATE);
  const secondResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (assertOkResult(firstResult) && assertOkResult(secondResult)) {
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
  if (assertOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { name, createdAt, updatedAt },
      },
    } = createResult.value;

    const expectedEntity = copyEntity(TITLE_ONLY_ADMIN_ENTITY, {
      id,
      info: {
        name,
        status: AdminEntityStatus.published,
        createdAt,
        updatedAt,
      },
    });

    assertResultValue(createResult, {
      effect: 'createdAndPublished',
      entity: expectedEntity,
    });

    const getResult = await client.getEntity({ id });
    assertResultValue(getResult, expectedEntity);
  }
}

async function createEntity_publishWithSubjectAuthKey({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } }),
    { publish: true }
  );
  if (assertOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { name, createdAt, updatedAt },
      },
    } = createResult.value;

    const expectedEntity = copyEntity(TITLE_ONLY_ADMIN_ENTITY, {
      id,
      info: {
        name,
        status: AdminEntityStatus.published,
        authKey: 'subject',
        createdAt,
        updatedAt,
      },
    });

    assertResultValue(createResult, {
      effect: 'createdAndPublished',
      entity: expectedEntity,
    });

    const getResult = await client.getEntity({ id, authKeys: ['subject'] });
    assertResultValue(getResult, expectedEntity);
  }
}

async function createEntity_withTwoReferences({ client }: AdminEntityTestContext) {
  const createTitleOnly1Result = await client.createEntity(TITLE_ONLY_CREATE);
  const createTitleOnly2Result = await client.createEntity(TITLE_ONLY_CREATE);
  if (assertOkResult(createTitleOnly1Result) && assertOkResult(createTitleOnly2Result)) {
    const {
      entity: { id: idTitleOnly1 },
    } = createTitleOnly1Result.value;
    const {
      entity: { id: idTitleOnly2 },
    } = createTitleOnly2Result.value;

    const createResult = await client.createEntity(
      copyEntity(REFERENCES_CREATE, {
        fields: { any: { id: idTitleOnly1 }, titleOnly: { id: idTitleOnly2 } },
      })
    );

    if (assertOkResult(createResult)) {
      const {
        entity: {
          id,
          info: { name, createdAt, updatedAt },
        },
      } = createResult.value;

      const expectedEntity = copyEntity(REFERENCES_ADMIN_ENTITY, {
        id,
        info: {
          name,
          createdAt,
          updatedAt,
        },
        fields: {
          any: { id: idTitleOnly1 },
          titleOnly: { id: idTitleOnly2 },
        },
      });

      assertResultValue(createResult, {
        effect: 'created',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      assertResultValue(getResult, expectedEntity);
    }
  }
}

async function createEntity_errorPublishWithoutRequiredTitle({ client }: AdminEntityTestContext) {
  const id = uuidv4();
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { id, fields: { title: null } }),
    { publish: true }
  );
  assertErrorResult(
    createResult,
    ErrorType.BadRequest,
    `entity(${id}).fields.title: Required field is empty`
  );

  const getResult = await client.getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotFound, 'No such entity');
}
