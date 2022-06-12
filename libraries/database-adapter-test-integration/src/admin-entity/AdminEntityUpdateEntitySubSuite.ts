import { AdminEntityStatus, copyEntity, ErrorType } from '@jonasb/datadata-core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  LOCATIONS_CREATE,
  REFERENCES_ADMIN_ENTITY,
  REFERENCES_CREATE,
  TITLE_ONLY_CREATE,
} from '../shared-entity/Fixtures.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const UpdateEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  updateEntity_minimal,
  updateEntity_noChange,
  updateEntity_minimalWithSubjectAuthKey,
  updateEntity_minimalWithoutProvidingSubjectAuthKey,
  updateEntity_updateAndPublishEntity,
  updateEntity_updateAndPublishEntityWithSubjectAuthKey,
  updateEntity_noChangeAndPublishDraftEntity,
  updateEntity_noChangeAndPublishPublishedEntity,
  updateEntity_withTwoReferences,
  updateEntity_withMultipleLocations,
  updateEntity_errorInvalidId,
  updateEntity_errorDifferentType,
  updateEntity_errorTryingToChangeAuthKey,
  updateEntity_errorMultilineStringInTitle,
  updateEntity_errorPublishWithoutRequiredTitle,
  updateEntity_errorInvalidField,
];

async function updateEntity_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;
  const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });
  assertOkResult(updateResult);
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

  assertResultValue(updateResult, {
    effect: 'updated',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function updateEntity_noChange({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      fields: { title },
    },
  } = createResult.value;
  const updateResult = await client.updateEntity({ id, fields: { title } });
  assertResultValue(updateResult, {
    effect: 'none',
    entity: createResult.value.entity,
  });
}

async function updateEntity_minimalWithSubjectAuthKey({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;
  const updateResult = await client.updateEntity({
    id,
    info: { authKey: 'subject' },
    fields: { title: 'Updated title' },
  });
  assertOkResult(updateResult);
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

  assertResultValue(updateResult, {
    effect: 'updated',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function updateEntity_minimalWithoutProvidingSubjectAuthKey({
  client,
}: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;
  const updateResult = await client.updateEntity({
    id,
    fields: { title: 'Updated title' },
  });
  assertOkResult(updateResult);
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

  assertResultValue(updateResult, {
    effect: 'updated',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function updateEntity_updateAndPublishEntity({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;
  const updateResult = await client.updateEntity(
    { id, fields: { title: 'Updated title' } },
    { publish: true }
  );
  assertOkResult(updateResult);
  const {
    entity: {
      info: { updatedAt },
    },
  } = updateResult.value;

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: {
      updatedAt,
      version: 1,
      status: AdminEntityStatus.published,
    },
    fields: {
      title: 'Updated title',
    },
  });

  assertResultValue(updateResult, {
    effect: 'updatedAndPublished',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function updateEntity_updateAndPublishEntityWithSubjectAuthKey({
  client,
}: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;
  const updateResult = await client.updateEntity(
    { id, info: { authKey: 'subject' }, fields: { title: 'Updated title' } },
    { publish: true }
  );
  assertOkResult(updateResult);
  const {
    entity: {
      info: { updatedAt },
    },
  } = updateResult.value;

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: {
      updatedAt,
      version: 1,
      status: AdminEntityStatus.published,
    },
    fields: {
      title: 'Updated title',
    },
  });

  assertResultValue(updateResult, {
    effect: 'updatedAndPublished',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function updateEntity_noChangeAndPublishDraftEntity({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      fields: { title },
    },
  } = createResult.value;
  const updateResult = await client.updateEntity({ id, fields: { title } }, { publish: true });
  assertOkResult(updateResult);
  const {
    entity: {
      info: { updatedAt },
    },
  } = updateResult.value;

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: {
      updatedAt,
      status: AdminEntityStatus.published,
    },
  });

  assertResultValue(updateResult, {
    effect: 'published',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function updateEntity_noChangeAndPublishPublishedEntity({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(createResult);
  const {
    entity: {
      id,
      fields: { title },
    },
  } = createResult.value;
  const updateResult = await client.updateEntity({ id, fields: { title } }, { publish: true });
  assertOkResult(updateResult);
  assertResultValue(updateResult, {
    effect: 'none',
    entity: createResult.value.entity,
  });
}

async function updateEntity_withTwoReferences({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(REFERENCES_CREATE);
  const createTitleOnly1Result = await client.createEntity(TITLE_ONLY_CREATE);
  const createTitleOnly2Result = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  assertOkResult(createTitleOnly1Result);
  assertOkResult(createTitleOnly2Result);

  const {
    entity: {
      id,
      info: { name, createdAt },
    },
  } = createResult.value;
  const {
    entity: { id: idTitleOnly1 },
  } = createTitleOnly1Result.value;
  const {
    entity: { id: idTitleOnly2 },
  } = createTitleOnly2Result.value;

  const updateResult = await client.updateEntity({
    id,
    fields: { any: { id: idTitleOnly1 }, titleOnly: { id: idTitleOnly2 } },
  });

  assertOkResult(updateResult);
  const {
    entity: {
      info: { updatedAt },
    },
  } = updateResult.value;

  const expectedEntity = copyEntity(REFERENCES_ADMIN_ENTITY, {
    id,
    info: {
      name,
      createdAt,
      updatedAt,
      version: 1,
    },
    fields: {
      any: { id: idTitleOnly1 },
      titleOnly: { id: idTitleOnly2 },
    },
  });

  assertResultValue(updateResult, {
    effect: 'updated',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function updateEntity_withMultipleLocations({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(LOCATIONS_CREATE);

  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity({
    id,
    fields: {
      location: { lat: 1, lng: 2 },
      locationList: [
        { lat: 3, lng: 4 },
        { lat: -179, lng: -178 },
      ],
    },
  });
  assertOkResult(updateResult);
  const {
    entity: {
      info: { updatedAt },
    },
  } = updateResult.value;

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: { updatedAt, version: 1 },
    fields: {
      location: { lat: 1, lng: 2 },
      locationList: [
        { lat: 3, lng: 4 },
        { lat: -179, lng: -178 },
      ],
    },
  });

  assertResultValue(updateResult, {
    effect: 'updated',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function updateEntity_errorInvalidId({ client }: AdminEntityTestContext) {
  const result = await client.updateEntity({
    id: 'f773ac54-37db-42df-9b55-b6da8de344c3',
    info: { name: 'Updated name' },
    fields: {},
  });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function updateEntity_errorDifferentType({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;
  const updateResult = await client.updateEntity({ id, info: { type: 'References' }, fields: {} });
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    'New type References doesn’t correspond to previous type TitleOnly'
  );
}

async function updateEntity_errorTryingToChangeAuthKey({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity({
    id,
    info: { authKey: 'subject' },
    fields: {},
  });
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    'New authKey subject doesn’t correspond to previous authKey none'
  );

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, createResult.value.entity);
}

async function updateEntity_errorMultilineStringInTitle({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity({ id, fields: { title: 'Hello\nWorld' } });
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    'entity.fields.title: multiline string not allowed'
  );

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, createResult.value.entity);
}

async function updateEntity_errorPublishWithoutRequiredTitle({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity(
    { id, fields: { title: null } },
    { publish: true }
  );
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    `entity(${id}).fields.title: Required field is empty`
  );

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, createResult.value.entity);
}

async function updateEntity_errorInvalidField({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity({ id, fields: { invalid: 'hello' } });
  assertErrorResult(updateResult, ErrorType.BadRequest, 'Unsupported field names: invalid');

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, createResult.value.entity);
}
