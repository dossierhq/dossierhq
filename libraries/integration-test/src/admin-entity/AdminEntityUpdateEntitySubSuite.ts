import { AdminEntityStatus, copyEntity, ErrorType } from '@dossierhq/core';
import { assertEquals, assertErrorResult, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdminReferences } from '../SchemaTypes.js';
import { assertIsAdminReferences } from '../SchemaTypes.js';
import {
  adminToPublishedEntity,
  LOCATIONS_CREATE,
  REFERENCES_ADMIN_ENTITY,
  REFERENCES_CREATE,
  STRINGS_CREATE,
  TITLE_ONLY_CREATE,
} from '../shared-entity/Fixtures.js';
import {
  adminClientForMainPrincipal,
  publishedClientForMainPrincipal,
} from '../shared-entity/TestClients.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const UpdateEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  updateEntity_minimal,
  updateEntity_noChange,
  updateEntity_minimalWithSubjectAuthKey,
  updateEntity_minimalWithoutProvidingSubjectAuthKey,
  updateEntity_updateAndPublishEntity,
  updateEntity_updateAndPublishEntityWithSubjectAuthKey,
  updateEntity_updateAndPublishEntityWithUniqueIndexValue,
  updateEntity_noChangeAndPublishDraftEntity,
  updateEntity_noChangeAndPublishPublishedEntity,
  updateEntity_withMultilineField,
  updateEntity_withTwoReferences,
  updateEntity_withMultipleLocations,
  updateEntity_removingUniqueIndexValueReleasesOwnership,
  updateEntity_errorInvalidId,
  updateEntity_errorDifferentType,
  updateEntity_errorTryingToChangeAuthKey,
  updateEntity_errorMultilineStringInTitle,
  updateEntity_errorPublishWithoutRequiredTitle,
  updateEntity_errorInvalidField,
  updateEntity_errorDuplicateUniqueIndexValue,
];

async function updateEntity_minimal({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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

async function updateEntity_noChange({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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

async function updateEntity_minimalWithSubjectAuthKey({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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
  server,
}: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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

async function updateEntity_updateAndPublishEntity({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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
  server,
}: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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

async function updateEntity_updateAndPublishEntityWithUniqueIndexValue({
  adminSchema,
  server,
}: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const createResult = await adminClient.createEntity(STRINGS_CREATE);
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const unique = Math.random().toString();
  const updateResult = await adminClient.updateEntity(
    { id, fields: { unique } },
    { publish: true }
  );
  assertOkResult(updateResult);

  const getAdminResult = await adminClient.getEntity({ index: 'stringsUnique', value: unique });
  assertResultValue(getAdminResult, updateResult.value.entity);

  const getPublishedResult = await publishedClient.getEntity({
    index: 'stringsUnique',
    value: unique,
  });
  assertResultValue(
    getPublishedResult,
    adminToPublishedEntity(adminSchema, updateResult.value.entity)
  );
}

async function updateEntity_noChangeAndPublishDraftEntity({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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

async function updateEntity_noChangeAndPublishPublishedEntity({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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

async function updateEntity_withMultilineField({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity(STRINGS_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;
  const updateResult = await client.updateEntity({ id, fields: { multiline: 'one\ntwo\nthree!' } });
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
      multiline: 'one\ntwo\nthree!',
    },
  });

  assertResultValue(updateResult, {
    effect: 'updated',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function updateEntity_withTwoReferences({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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

  const updateResult = await client.updateEntity<AdminReferences>({
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
  assertOkResult(getResult);
  assertIsAdminReferences(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function updateEntity_withMultipleLocations({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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

async function updateEntity_removingUniqueIndexValueReleasesOwnership({
  server,
}: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const unique = Math.random().toString();

  const createResult = await client.createEntity(
    copyEntity(STRINGS_CREATE, { fields: { unique } })
  );
  assertOkResult(createResult);

  const updateResult = await client.updateEntity({
    id: createResult.value.entity.id,
    fields: { unique: null },
  });
  assertOkResult(updateResult);

  const otherResult = await client.createEntity(copyEntity(STRINGS_CREATE, { fields: { unique } }));
  assertOkResult(otherResult);
}

async function updateEntity_errorInvalidId({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const result = await client.updateEntity({
    id: 'f773ac54-37db-42df-9b55-b6da8de344c3',
    info: { name: 'Updated name' },
    fields: {},
  });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function updateEntity_errorDifferentType({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;
  const updateResult = await client.updateEntity({ id, info: { type: 'References' }, fields: {} });
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    'entity.info.type: New type References doesn’t correspond to previous type TitleOnly'
  );
}

async function updateEntity_errorTryingToChangeAuthKey({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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
    'entity.info.authKey: New authKey subject doesn’t correspond to previous authKey none'
  );

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, createResult.value.entity);
}

async function updateEntity_errorMultilineStringInTitle({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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

async function updateEntity_errorPublishWithoutRequiredTitle({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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

async function updateEntity_errorInvalidField({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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

async function updateEntity_errorDuplicateUniqueIndexValue({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const unique = Math.random().toString();

  const otherResult = await client.createEntity(copyEntity(STRINGS_CREATE, { fields: { unique } }));
  assertOkResult(otherResult);

  const createResult = await client.createEntity(STRINGS_CREATE);
  assertOkResult(createResult);

  const updateResult = await client.updateEntity({
    id: createResult.value.entity.id,
    fields: { unique },
  });
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    'entity.fields.unique: Value is not unique (index: stringsUnique)'
  );
}
