import {
  EntityStatus,
  Schema,
  ErrorType,
  EventType,
  copyEntity,
  isEntityNameAsRequested,
  type AdminEntityUpdate,
} from '@dossierhq/core';
import {
  assertEquals,
  assertErrorResult,
  assertNotSame,
  assertOkResult,
  assertResultValue,
  assertSame,
  assertTruthy,
} from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  assertIsAdminChangeValidations,
  assertIsAdminComponents,
  assertIsAdminReferences,
  type AdminChangeValidations,
  type AdminComponents,
  type AdminReferences,
  type AdminSubjectOnly,
  type AdminTitleOnly,
} from '../SchemaTypes.js';
import { assertChangelogEventsConnection } from '../shared-entity/EventsTestUtils.js';
import {
  LOCATIONS_CREATE,
  REFERENCES_ADMIN_ENTITY,
  REFERENCES_CREATE,
  STRINGS_CREATE,
  SUBJECT_ONLY_CREATE,
  TITLE_ONLY_CREATE,
  adminToPublishedEntity,
} from '../shared-entity/Fixtures.js';
import {
  createEntityWithInvalidComponent,
  createInvalidEntity,
} from '../shared-entity/InvalidEntityUtils.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const UpdateEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  updateEntity_minimal,
  updateEntity_noChange,
  updateEntity_minimalWithSubjectAuthKey,
  updateEntity_minimalWithoutProvidingSubjectAuthKey,
  updateEntity_updateAndPublishEntity,
  updateEntity_updateAndPublishEntityWithSubjectAuthKey,
  updateEntity_updateAndPublishEntityWithUniqueIndexValue,
  updateEntity_updateAndPublishEntityWithConflictingPublishedName,
  updateEntity_noChangeAndPublishDraftEntity,
  updateEntity_noChangeAndPublishPublishedEntity,
  updateEntity_updateEntityEvent,
  updateEntity_updateAndPublishEntityEvent,
  updateEntity_fixInvalidEntity,
  updateEntity_fixInvalidComponent,
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
  updateEntity_errorReadonlySession,
];

async function updateEntity_minimal({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });
  const {
    entity: {
      info: { updatedAt },
    },
  } = updateResult.valueOrThrow();

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: {
      updatedAt,
      version: 2,
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

async function updateEntity_noChange({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminTitleOnly>(TITLE_ONLY_CREATE);
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

async function updateEntity_minimalWithSubjectAuthKey({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(SUBJECT_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity<AdminSubjectOnly>({
    id,
    info: { authKey: 'subject' },
    fields: { message: 'Updated message' },
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
      version: 2,
    },
    fields: {
      message: 'Updated message',
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
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(SUBJECT_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const updateResult = await client.updateEntity<AdminSubjectOnly>({
    id,
    fields: { message: 'Updated message' },
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
      version: 2,
    },
    fields: {
      message: 'Updated message',
    },
  });

  assertResultValue(updateResult, {
    effect: 'updated',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function updateEntity_updateAndPublishEntity({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  const { entity: originalEntity } = (
    await adminClient.createEntity(
      copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Original name' } }),
    )
  ).valueOrThrow();

  const updateResult = await adminClient.updateEntity(
    { id: originalEntity.id, info: { name: 'Updated name' }, fields: { title: 'Updated title' } },
    { publish: true },
  );
  const {
    entity: {
      info: { name: updatedName, updatedAt },
    },
  } = updateResult.valueOrThrow();

  const expectedEntity = copyEntity(originalEntity, {
    info: {
      updatedAt,
      version: 2,
      name: updatedName,
      status: EntityStatus.published,
      validPublished: true,
    },
    fields: {
      title: 'Updated title',
    },
  });

  assertResultValue(updateResult, {
    effect: 'updatedAndPublished',
    entity: expectedEntity,
  });

  const getAdminResult = await adminClient.getEntity({ id: originalEntity.id });
  assertResultValue(getAdminResult, expectedEntity);

  const publishedEntity = (
    await publishedClient.getEntity({ id: originalEntity.id })
  ).valueOrThrow();
  assertTruthy(isEntityNameAsRequested(publishedEntity.info.name, 'Updated name'));
  assertSame(publishedEntity.info.name, updatedName);
}

async function updateEntity_updateAndPublishEntityWithSubjectAuthKey({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(SUBJECT_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity<AdminSubjectOnly>(
    { id, info: { authKey: 'subject' }, fields: { message: 'Updated message' } },
    { publish: true },
  );
  const {
    entity: {
      info: { updatedAt },
    },
  } = updateResult.valueOrThrow();

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: {
      updatedAt,
      version: 2,
      status: EntityStatus.published,
      validPublished: true,
    },
    fields: {
      message: 'Updated message',
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
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const adminSchema = new Schema((await adminClient.getSchemaSpecification()).valueOrThrow());

  const createResult = await adminClient.createEntity(STRINGS_CREATE);
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const unique = Math.random().toString();
  const updateResult = await adminClient.updateEntity(
    { id, fields: { unique } },
    { publish: true },
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
    adminToPublishedEntity(adminSchema, updateResult.value.entity),
  );
}

async function updateEntity_updateAndPublishEntityWithConflictingPublishedName({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  // Create/publish first entity
  const {
    entity: {
      id: firstId,
      info: { name: firstOriginalName },
    },
  } = (
    await adminClient.createEntity(
      copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Original name' } }),
      { publish: true },
    )
  ).valueOrThrow();

  // Update name (without publishing), that way we only conflict on the published name
  assertOkResult(
    await adminClient.updateEntity({ id: firstId, info: { name: 'New name' }, fields: {} }),
  );

  // Create second entity with same name (should be ok since we don't publish)
  const {
    entity: {
      id: secondId,
      info: { name: secondOriginalName },
    },
  } = (
    await adminClient.createEntity(
      copyEntity(TITLE_ONLY_CREATE, { info: { name: firstOriginalName } }),
    )
  ).valueOrThrow();

  assertSame(firstOriginalName, secondOriginalName);

  // Update and publish second entity
  const {
    entity: {
      info: { name: secondUpdatedName },
    },
  } = (
    await adminClient.updateEntity(
      { id: secondId, fields: { title: 'Updated title' } },
      { publish: true },
    )
  ).valueOrThrow();

  assertNotSame(secondUpdatedName, secondOriginalName); // Changes since due to conflicting published name

  // Get second published entity

  const {
    info: { name: secondPublishedName },
  } = (await publishedClient.getEntity({ id: secondId })).valueOrThrow();
  assertSame(secondPublishedName, secondUpdatedName);
}

async function updateEntity_noChangeAndPublishDraftEntity({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  const createResult = await adminClient.createEntity<AdminTitleOnly>(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      fields: { title },
    },
  } = createResult.value;

  const updateResult = await adminClient.updateEntity({ id, fields: { title } }, { publish: true });
  assertOkResult(updateResult);
  const {
    entity: {
      info: { updatedAt },
    },
  } = updateResult.value;

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: {
      updatedAt,
      status: EntityStatus.published,
      validPublished: true,
    },
  });

  assertResultValue(updateResult, {
    effect: 'published',
    entity: expectedEntity,
  });

  const getAdminResult = await adminClient.getEntity({ id });
  assertResultValue(getAdminResult, expectedEntity);

  const publishedEntity = (await publishedClient.getEntity({ id })).valueOrThrow();
  assertSame(publishedEntity.info.name, expectedEntity.info.name);
}

async function updateEntity_noChangeAndPublishPublishedEntity({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminTitleOnly>(TITLE_ONLY_CREATE, {
    publish: true,
  });
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

async function updateEntity_updateEntityEvent({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name: originalName, createdAt },
    },
  } = createResult.value;

  const updateResult = await client.updateEntity({
    id,
    info: { name: 'Updated name' },
    fields: { title: 'Updated title' },
  });
  const {
    entity: {
      info: { updatedAt, name: updatedName },
    },
  } = updateResult.valueOrThrow();

  const connectionResult = await client.getChangelogEvents({ entity: { id } });
  assertChangelogEventsConnection(connectionResult, [
    {
      type: EventType.createEntity,
      createdAt,
      createdBy: '',
      entities: [{ id, name: originalName, version: 1, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
    {
      type: EventType.updateEntity,
      createdAt: updatedAt,
      createdBy: '',
      entities: [{ id, name: updatedName, version: 2, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
  ]);
}

async function updateEntity_updateAndPublishEntityEvent({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name: originalName, createdAt },
    },
  } = createResult.value;

  const updateResult = await client.updateEntity(
    {
      id,
      info: { name: 'Updated name' },
      fields: { title: 'Updated title' },
    },
    { publish: true },
  );
  const {
    entity: {
      info: { updatedAt, name: updatedName },
    },
  } = updateResult.valueOrThrow();

  const connectionResult = await client.getChangelogEvents({ entity: { id } });
  assertChangelogEventsConnection(connectionResult, [
    {
      type: EventType.createEntity,
      createdAt,
      createdBy: '',
      entities: [{ id, name: originalName, version: 1, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
    {
      type: EventType.updateAndPublishEntity,
      createdAt: updatedAt,
      createdBy: '',
      entities: [{ id, name: updatedName, version: 2, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
  ]);
}

async function updateEntity_fixInvalidEntity({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();

  const { entity } = (
    await createInvalidEntity(adminClient, { matchPattern: 'no match' })
  ).valueOrThrow();

  const updateResult = await adminClient.updateEntity<AdminChangeValidations>({
    id: entity.id,
    fields: { matchPattern: 'foo' },
  });
  const {
    entity: {
      info: { updatedAt },
    },
  } = updateResult.valueOrThrow();

  const expectedEntity = copyEntity(entity, {
    info: {
      updatedAt,
      version: 2,
      valid: true,
    },
    fields: {
      matchPattern: 'foo',
    },
  });

  assertResultValue(updateResult, {
    effect: 'updated',
    entity: expectedEntity,
  });

  const getEntity = (await adminClient.getEntity({ id: entity.id })).valueOrThrow();
  assertIsAdminChangeValidations(getEntity);
  assertEquals(getEntity, expectedEntity);
}

async function updateEntity_fixInvalidComponent({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();

  const { entity } = (await createEntityWithInvalidComponent(adminClient)).valueOrThrow();

  const updateResult = await adminClient.updateEntity<AdminComponents>({
    id: entity.id,
    fields: { any: { type: 'ChangeValidationsComponent', matchPattern: 'foo' } },
  });
  const {
    entity: {
      info: { updatedAt },
    },
  } = updateResult.valueOrThrow();

  const expectedEntity = copyEntity(entity, {
    info: { updatedAt, version: 2, valid: true },
    fields: { any: { type: 'ChangeValidationsComponent', matchPattern: 'foo' } },
  });

  assertResultValue(updateResult, {
    effect: 'updated',
    entity: expectedEntity,
  });

  const getEntity = (await adminClient.getEntity({ id: entity.id })).valueOrThrow();
  assertIsAdminComponents(getEntity);
  assertEquals(getEntity, expectedEntity);
}

async function updateEntity_withMultilineField({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
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
      version: 2,
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

async function updateEntity_withTwoReferences({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
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
      version: 2,
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

async function updateEntity_withMultipleLocations({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
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
    info: { updatedAt, version: 2 },
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
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const unique = Math.random().toString();

  const createResult = await client.createEntity(
    copyEntity(STRINGS_CREATE, { fields: { unique } }),
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

async function updateEntity_errorInvalidId({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const result = await client.updateEntity({
    id: 'f773ac54-37db-42df-9b55-b6da8de344c3',
    info: { name: 'Updated name' },
    fields: {},
  });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function updateEntity_errorDifferentType({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;
  const updateResult = await client.updateEntity({ id, info: { type: 'References' }, fields: {} });
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    'entity.info.type: New type References doesn’t correspond to previous type TitleOnly',
  );
}

async function updateEntity_errorTryingToChangeAuthKey({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
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
    'entity.info.authKey: New authKey doesn’t correspond to previous authKey (subject!=)',
  );

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, createResult.value.entity);
}

async function updateEntity_errorMultilineStringInTitle({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity({ id, fields: { title: 'Hello\nWorld' } });
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    'entity.fields.title: Value cannot contain line breaks',
  );

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, createResult.value.entity);
}

async function updateEntity_errorPublishWithoutRequiredTitle({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity(
    { id, fields: { title: null } },
    { publish: true },
  );
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    `entity(${id}).fields.title: Required field is empty`,
  );

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, createResult.value.entity);
}

async function updateEntity_errorInvalidField({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity({
    id,
    fields: { invalid: 'hello' },
  } as AdminEntityUpdate<AdminTitleOnly>);
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    'entity.fields: TitleOnly does not include the fields: invalid',
  );

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, createResult.value.entity);
}

async function updateEntity_errorDuplicateUniqueIndexValue({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
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
    `entity.fields.unique: Value is not unique (stringsUnique:${unique})`,
  );
}

async function updateEntity_errorReadonlySession({ clientProvider }: AdminEntityTestContext) {
  const normalAdminClient = clientProvider.adminClient();
  const readonlyAdminClient = clientProvider.adminClient('main', 'readonly');

  const createResult = await normalAdminClient.createEntity(TITLE_ONLY_CREATE);
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const updateResult = await readonlyAdminClient.updateEntity({
    id,
    info: { name: 'Updated name' },
    fields: {},
  });
  assertErrorResult(updateResult, ErrorType.BadRequest, 'Readonly session used to update entity');
}
