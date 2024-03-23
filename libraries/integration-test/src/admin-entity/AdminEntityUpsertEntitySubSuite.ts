import { AdminEntityStatus, copyEntity, ErrorType } from '@dossierhq/core';
import { v4 as uuidv4 } from 'uuid';
import { assertEquals, assertErrorResult, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdminTitleOnly } from '../SchemaTypes.js';
import { assertIsAdminTitleOnly } from '../SchemaTypes.js';
import {
  SUBJECT_ONLY_UPSERT,
  TITLE_ONLY_ADMIN_ENTITY,
  TITLE_ONLY_CREATE,
  TITLE_ONLY_UPSERT,
} from '../shared-entity/Fixtures.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const UpsertEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  upsertEntity_minimalCreate,
  upsertEntity_minimalUpdate,
  upsertEntity_createNoAuthKey,
  upsertEntity_updateWithoutChange,
  upsertEntity_updateAndPublishWithSubjectAuthKey,
  upsertEntity_errorCreateAuthKeyNotMatchingPattern,
  upsertEntity_errorUpdateTryingToChangeAuthKey,
  upsertEntity_errorUpdateNoAuthKeyWhenExistingHasAuthKey,
  upsertEntity_errorCreateReadonlySession,
  upsertEntity_errorUpdateReadonlySession,
];

async function upsertEntity_minimalCreate({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const id = uuidv4();
  const upsertResult = await client.upsertEntity<AdminTitleOnly>(
    copyEntity(TITLE_ONLY_UPSERT, { id }),
  );
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
  assertIsAdminTitleOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function upsertEntity_minimalUpdate({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
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

async function upsertEntity_createNoAuthKey({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const id = uuidv4();
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
  const client = clientProvider.adminClient();
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
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const upsertResult = await client.upsertEntity(
    copyEntity(TITLE_ONLY_UPSERT, {
      id,
      info: { authKey: 'subject' },
      fields: { title: 'Updated title' },
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
    info: { version: 2, updatedAt, status: AdminEntityStatus.published, validPublished: true },
    fields: { title: 'Updated title' },
  });

  assertResultValue(upsertResult, {
    effect: 'updatedAndPublished',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function upsertEntity_errorCreateAuthKeyNotMatchingPattern({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const id = uuidv4();
  const upsertResult = await client.upsertEntity(
    copyEntity(SUBJECT_ONLY_UPSERT, { id, info: { authKey: 'none' } }),
  );
  assertErrorResult(
    upsertResult,
    ErrorType.BadRequest,
    "info.authKey: AuthKey 'none' does not match pattern 'subject' (^subject$)",
  );

  const getResult = await client.getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotFound, 'No such entity');
}

async function upsertEntity_errorUpdateTryingToChangeAuthKey({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.upsertEntity(
    copyEntity(TITLE_ONLY_UPSERT, {
      id,
      info: { authKey: 'subject' },
      fields: {},
    }),
  );
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    'entity.info.authKey: New authKey doesn’t correspond to previous authKey (subject!=none)',
  );

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, createResult.value.entity);
}

async function upsertEntity_errorUpdateNoAuthKeyWhenExistingHasAuthKey({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.upsertEntity(
    copyEntity(TITLE_ONLY_UPSERT, {
      id,
      info: { authKey: undefined },
      fields: {},
    }),
  );
  assertErrorResult(
    updateResult,
    ErrorType.BadRequest,
    'entity.info.authKey: New authKey doesn’t correspond to previous authKey (!=none)',
  );

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, createResult.value.entity);
}

async function upsertEntity_errorCreateReadonlySession({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient('main', 'readonly');
  const upsertResult = await client.upsertEntity(copyEntity(TITLE_ONLY_UPSERT, { id: uuidv4() }));
  assertErrorResult(upsertResult, ErrorType.BadRequest, 'Readonly session used to create entity');
}

async function upsertEntity_errorUpdateReadonlySession({ clientProvider }: AdminEntityTestContext) {
  const normalAdminClient = clientProvider.adminClient();
  const readonlyAdminClient = clientProvider.adminClient('main', 'readonly');

  const {
    entity: { id },
  } = (await normalAdminClient.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();

  const upsertResult = await readonlyAdminClient.upsertEntity(
    copyEntity(TITLE_ONLY_UPSERT, { id }),
  );
  assertErrorResult(upsertResult, ErrorType.BadRequest, 'Readonly session used to update entity');
}
