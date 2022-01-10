import { AdminEntityStatus, copyEntity, ErrorType } from '@jonasb/datadata-core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures';
import {
  adminClientForMainPrincipal,
  adminClientForSecondaryPrincipal,
} from '../shared-entity/TestClients';

export const PublishEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  publishEntities_minimal,
  publishEntities_authKeySubject,
  publishEntities_oldVersion,
  publishEntities_errorInvalidId,
  publishEntities_errorDuplicateIds,
  publishEntities_errorMissingRequiredTitle,
  publishEntities_errorWrongAuthKey,
];

async function publishEntities_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.value;

  const publishResult = await client.publishEntities([{ id, version }]);
  assertOkResult(publishResult);
  const [{ updatedAt }] = publishResult.value;
  assertResultValue(publishResult, [
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
  assertResultValue(getResult, expectedEntity);
}

async function publishEntities_authKeySubject({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.value;

  const publishResult = await client.publishEntities([{ id, version }]);
  assertOkResult(publishResult);
  const [{ updatedAt }] = publishResult.value;
  assertResultValue(publishResult, [
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
  assertResultValue(getResult, expectedEntity);
}

async function publishEntities_oldVersion({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });
  assertOkResult(updateResult);

  const publishResult = await client.publishEntities([{ id, version: 0 }]);
  assertOkResult(publishResult);
  const [{ updatedAt }] = publishResult.value;
  assertResultValue(publishResult, [
    {
      id,
      effect: 'published',
      status: AdminEntityStatus.modified,
      updatedAt,
    },
  ]);

  const expectedEntity = copyEntity(updateResult.value.entity, {
    info: { status: AdminEntityStatus.modified, updatedAt },
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function publishEntities_errorInvalidId({ server }: AdminEntityTestContext) {
  const publishResult = await adminClientForMainPrincipal(server).publishEntities([
    { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290', version: 0 },
  ]);
  assertErrorResult(
    publishResult,
    ErrorType.NotFound,
    'No such entities: b1bdcb61-e6aa-47ff-98d8-4cfe8197b290'
  );
}

async function publishEntities_errorDuplicateIds({ server }: AdminEntityTestContext) {
  const publishResult = await adminClientForMainPrincipal(server).publishEntities([
    { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290', version: 0 },
    { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290', version: 1 },
  ]);
  assertErrorResult(
    publishResult,
    ErrorType.BadRequest,
    'Duplicate ids: b1bdcb61-e6aa-47ff-98d8-4cfe8197b290'
  );
}

async function publishEntities_errorMissingRequiredTitle({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { fields: { title: null } })
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.value;

  const publishResult = await client.publishEntities([{ id, version }]);
  assertErrorResult(
    publishResult,
    ErrorType.BadRequest,
    `entity(${id}).fields.title: Required field is empty`
  );
}

async function publishEntities_errorWrongAuthKey({ server }: AdminEntityTestContext) {
  const createResult = await adminClientForMainPrincipal(server).createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.value;

  const publishResult = await adminClientForSecondaryPrincipal(server).publishEntities([
    { id, version },
  ]);
  assertErrorResult(
    publishResult,
    ErrorType.NotAuthorized,
    `entity(${id}): Wrong authKey provided`
  );
}
