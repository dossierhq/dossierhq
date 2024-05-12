import {
  copyEntity,
  EntityStatus,
  ErrorType,
  EventType,
  isEntityNameAsRequested,
} from '@dossierhq/core';
import {
  assertEquals,
  assertErrorResult,
  assertOkResult,
  assertResultValue,
  assertTruthy,
} from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import { assertIsTitleOnly, type TitleOnly } from '../SchemaTypes.js';
import { assertChangelogEventsConnection } from '../shared-entity/EventsTestUtils.js';
import {
  SUBJECT_ONLY_CREATE,
  SUBJECT_ONLY_UPSERT,
  TITLE_ONLY_ADMIN_ENTITY,
  TITLE_ONLY_CREATE,
  TITLE_ONLY_UPSERT,
} from '../shared-entity/Fixtures.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const UpsertEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  upsertEntity_minimalCreate,
  upsertEntity_minimalUpdate,
  upsertEntity_createNoName,
  upsertEntity_createNoAuthKey,
  upsertEntity_updateWithoutChange,
  upsertEntity_updateAndPublishWithSubjectAuthKey,
  upsertEntity_createEntityEvent,
  upsertEntity_createAndPublishEntityEvent,
  upsertEntity_updateEntityEvent,
  upsertEntity_updateAndPublishEntityEvent,
  upsertEntity_publishEntitiesEventDueToNoChangeAndPublish,
  upsertEntity_errorCreateAuthKeyNotMatchingPattern,
  upsertEntity_errorUpdateTryingToChangeAuthKey,
  upsertEntity_errorUpdateNoAuthKeyWhenExistingHasAuthKey,
  upsertEntity_errorCreateReadonlySession,
  upsertEntity_errorUpdateReadonlySession,
];

async function upsertEntity_minimalCreate({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
  const upsertResult = await client.upsertEntity<TitleOnly>(copyEntity(TITLE_ONLY_UPSERT, { id }));
  assertOkResult(upsertResult);
  const {
    entity: {
      info: { name, createdAt, updatedAt },
    },
  } = upsertResult.value;

  const expectedEntity = copyEntity(TITLE_ONLY_ADMIN_ENTITY, {
    id,
    info: {
      name,
      createdAt,
      updatedAt,
    },
  });

  assertResultValue(upsertResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsTitleOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function upsertEntity_minimalUpdate({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const upsertResult = await client.upsertEntity(
    copyEntity(TITLE_ONLY_UPSERT, { id, fields: { title: 'Updated title' } }),
  );
  assertOkResult(upsertResult);
  const {
    entity: {
      info: { updatedAt },
    },
  } = upsertResult.value;

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: { version: 2, updatedAt },
    fields: { title: 'Updated title' },
  });

  assertResultValue(upsertResult, {
    effect: 'updated',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function upsertEntity_createNoName({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
  const { entity } = (
    await client.upsertEntity({ id, info: { type: 'TitleOnly' }, fields: {} })
  ).valueOrThrow();

  assertTruthy(isEntityNameAsRequested(entity.info.name, 'TitleOnly'));
}

async function upsertEntity_createNoAuthKey({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
  const { entity } = (
    await client.upsertEntity({
      id,
      info: { type: 'TitleOnly', name: 'TitleOnly name' },
      fields: {},
    })
  ).valueOrThrow();

  assertEquals(entity.info.authKey, '');
}

async function upsertEntity_updateWithoutChange({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const { entity } = createResult.value;

  const upsertResult = await client.upsertEntity(copyEntity(TITLE_ONLY_UPSERT, { id: entity.id }));
  assertOkResult(upsertResult);

  assertResultValue(upsertResult, {
    effect: 'none',
    entity,
  });

  const getResult = await client.getEntity({ id: entity.id });
  assertResultValue(getResult, entity);
}

async function upsertEntity_updateAndPublishWithSubjectAuthKey({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(SUBJECT_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const upsertResult = await client.upsertEntity(
    copyEntity(SUBJECT_ONLY_UPSERT, {
      id,
      info: { authKey: 'subject' },
      fields: { message: 'Updated message' },
    }),
    { publish: true },
  );
  assertOkResult(upsertResult);
  const {
    entity: {
      info: { updatedAt },
    },
  } = upsertResult.value;

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: { version: 2, updatedAt, status: EntityStatus.published, validPublished: true },
    fields: { message: 'Updated message' },
  });

  assertResultValue(upsertResult, {
    effect: 'updatedAndPublished',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function upsertEntity_createEntityEvent({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
  const createResult = await client.upsertEntity(copyEntity(TITLE_ONLY_UPSERT, { id }));
  const {
    entity: {
      info: { name, createdAt, updatedAt, version },
    },
  } = createResult.valueOrThrow();

  assertEquals(createdAt, updatedAt);

  const connectionResult = await client.getChangelogEvents({ entity: { id } });
  assertChangelogEventsConnection(connectionResult, [
    {
      type: EventType.createEntity,
      createdAt,
      createdBy: '',
      entities: [{ id, name, version, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
  ]);
}

async function upsertEntity_createAndPublishEntityEvent({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
  const createResult = await client.upsertEntity(copyEntity(TITLE_ONLY_UPSERT, { id }), {
    publish: true,
  });
  const {
    entity: {
      info: { name, createdAt, updatedAt, version },
    },
  } = createResult.valueOrThrow();

  assertEquals(createdAt, updatedAt);

  const connectionResult = await client.getChangelogEvents({ entity: { id } });
  assertChangelogEventsConnection(connectionResult, [
    {
      type: EventType.createAndPublishEntity,
      createdAt,
      createdBy: '',
      entities: [{ id, name, version, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
  ]);
}

async function upsertEntity_updateEntityEvent({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  const {
    entity: {
      id,
      info: { name: originalName, createdAt },
    },
  } = createResult.valueOrThrow();

  const updateResult = await client.upsertEntity({
    id,
    info: { type: 'TitleOnly', name: 'Updated name' },
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

async function upsertEntity_updateAndPublishEntityEvent({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  const {
    entity: {
      id,
      info: { name: originalName, createdAt },
    },
  } = createResult.valueOrThrow();

  const updateResult = await client.upsertEntity(
    {
      id,
      info: { type: 'TitleOnly', name: 'Updated name' },
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

async function upsertEntity_publishEntitiesEventDueToNoChangeAndPublish({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  const {
    entity: {
      id,
      info: { name, createdAt },
    },
  } = createResult.valueOrThrow();

  const updateResult = await client.upsertEntity(
    { id, info: { type: 'TitleOnly' }, fields: {} },
    { publish: true },
  );
  const {
    effect: updateEffect,
    entity: {
      info: { updatedAt },
    },
  } = updateResult.valueOrThrow();
  assertEquals(updateEffect, 'published');

  const connectionResult = await client.getChangelogEvents({ entity: { id } });
  assertChangelogEventsConnection(connectionResult, [
    {
      type: EventType.createEntity,
      createdAt,
      createdBy: '',
      entities: [{ id, name, version: 1, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
    {
      type: EventType.publishEntities,
      createdAt: updatedAt,
      createdBy: '',
      entities: [{ id, name, version: 1, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
  ]);
}

async function upsertEntity_errorCreateAuthKeyNotMatchingPattern({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
  const upsertResult = await client.upsertEntity(
    copyEntity(SUBJECT_ONLY_UPSERT, { id, info: { authKey: '' as 'subject' } }),
  );
  assertErrorResult(
    upsertResult,
    ErrorType.BadRequest,
    "info.authKey: AuthKey '' does not match pattern 'subject' (^subject$)",
  );

  const getResult = await client.getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotFound, 'No such entity');
}

async function upsertEntity_errorUpdateTryingToChangeAuthKey({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.upsertEntity(
    copyEntity(TITLE_ONLY_UPSERT, {
      id,
      info: { authKey: 'subject' as '' },
      fields: {},
    }),
  );
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    'entity.info.authKey: New authKey doesn’t correspond to previous authKey (subject!=)',
  );

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, createResult.value.entity);
}

async function upsertEntity_errorUpdateNoAuthKeyWhenExistingHasAuthKey({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(SUBJECT_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.upsertEntity(
    copyEntity(SUBJECT_ONLY_UPSERT, {
      id,
      info: { authKey: undefined },
      fields: {},
    }),
  );
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    'entity.info.authKey: New authKey doesn’t correspond to previous authKey (!=subject)',
  );

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, createResult.value.entity);
}

async function upsertEntity_errorCreateReadonlySession({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient('main', 'readonly');
  const upsertResult = await client.upsertEntity(
    copyEntity(TITLE_ONLY_UPSERT, { id: crypto.randomUUID() }),
  );
  assertErrorResult(upsertResult, ErrorType.BadRequest, 'Readonly session used to create entity');
}

async function upsertEntity_errorUpdateReadonlySession({ clientProvider }: AdminEntityTestContext) {
  const normalClient = clientProvider.dossierClient();
  const readonlyClient = clientProvider.dossierClient('main', 'readonly');

  const {
    entity: { id },
  } = (await normalClient.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();

  const upsertResult = await readonlyClient.upsertEntity(copyEntity(TITLE_ONLY_UPSERT, { id }));
  assertErrorResult(upsertResult, ErrorType.BadRequest, 'Readonly session used to update entity');
}
