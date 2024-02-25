import { copyEntity, ErrorType, isEntityNameAsRequested } from '@dossierhq/core';
import {
  assertEquals,
  assertErrorResult,
  assertOkResult,
  assertResultValue,
  assertSame,
} from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdminTitleOnly, AppAdminUniqueIndexes } from '../SchemaTypes.js';
import { assertIsAdminTitleOnly } from '../SchemaTypes.js';
import { STRINGS_CREATE, TITLE_ONLY_CREATE } from '../shared-entity/Fixtures.js';
import { createInvalidEntity } from '../shared-entity/InvalidEntityUtils.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const GetEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getEntity_withSubjectAuthKey,
  getEntity_getLatestVersion,
  getEntity_usingUniqueIndex,
  getEntity_getOldVersion,
  getEntity_invalidEntity,
  getEntity_invalidPublishedEntity,
  getEntity_errorInvalidId,
  getEntity_errorInvalidVersion,
  getEntity_errorInvalidUniqueIndexValue,
  getEntity_errorWrongAuthKey,
  getEntity_errorWrongAuthKeyFromReadonlyRandom,
];

async function getEntity_withSubjectAuthKey({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminTitleOnly>(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminTitleOnly(getResult.value);
  assertEquals(getResult.value, createResult.value.entity);
}

async function getEntity_getLatestVersion({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await adminClient.updateEntity({ id, fields: { title: 'Updated title' } });
  assertOkResult(updateResult);

  const result = await adminClient.getEntity({ id });
  assertOkResult(result);
  assertResultValue(result, updateResult.value.entity);
}

async function getEntity_usingUniqueIndex({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const unique = Math.random().toString();
  const createResult = await adminClient.createEntity(
    copyEntity(STRINGS_CREATE, { fields: { unique } }),
  );
  assertOkResult(createResult);

  const result = await adminClient.getEntity({ index: 'stringsUnique', value: unique });
  assertOkResult(result);
  assertResultValue(result, createResult.value.entity);
}

async function getEntity_getOldVersion({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Original name' } }),
  );
  const { entity: originalEntity } = createResult.valueOrThrow();

  const updateResult = await adminClient.updateEntity({
    id: originalEntity.id,
    info: { name: 'Updated name' },
    fields: { title: 'Updated title' },
  });
  assertOkResult(updateResult);

  const result = await adminClient.getEntity({
    id: originalEntity.id,
    version: originalEntity.info.version,
  });
  assertOkResult(result);
  assertResultValue(result, originalEntity);
  assertSame(isEntityNameAsRequested(result.value.info.name, 'Original name'), true);
}

async function getEntity_invalidEntity({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const { entity } = (
    await createInvalidEntity(adminClient, { matchPattern: 'no match' })
  ).valueOrThrow();

  const result = await adminClient.getEntity({ id: entity.id });
  assertOkResult(result);
  assertSame(result.value.info.valid, false);
  assertSame(result.value.info.validPublished, null); // not published
}

async function getEntity_invalidPublishedEntity({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const { entity } = (
    await createInvalidEntity(adminClient, { required: null }, { publish: true })
  ).valueOrThrow();

  const result = await adminClient.getEntity({ id: entity.id });
  assertOkResult(result);
  assertSame(result.value.info.valid, true);
  assertSame(result.value.info.validPublished, false);
}

async function getEntity_errorInvalidId({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const result = await client.getEntity({ id: '13e4c7da-616e-44a3-a039-24f96f9b17da' });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function getEntity_errorInvalidVersion({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);

  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const resultMinusOne = await client.getEntity({ id, version: 0 });
  assertErrorResult(resultMinusOne, ErrorType.NotFound, 'No such entity or version');

  const resultPlusOne = await client.getEntity({ id, version: 2 });
  assertErrorResult(resultPlusOne, ErrorType.NotFound, 'No such entity or version');
}

async function getEntity_errorInvalidUniqueIndexValue({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const result = await client.getEntity({
    index: 'unknown-index' as AppAdminUniqueIndexes,
    value: 'unknown-value',
  });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function getEntity_errorWrongAuthKey({ clientProvider }: AdminEntityTestContext) {
  const createResult = await clientProvider.adminClient().createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      info: { authKey: 'subject' },
    }),
  );

  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await clientProvider.adminClient('secondary').getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
}

async function getEntity_errorWrongAuthKeyFromReadonlyRandom({
  clientProvider,
}: AdminEntityTestContext) {
  const { entity } = (
    await clientProvider.adminClient().createEntity(
      copyEntity(TITLE_ONLY_CREATE, {
        info: { authKey: 'subject' },
      }),
    )
  ).valueOrThrow();

  const getResult = await clientProvider
    .adminClient('random', 'readonly')
    .getEntity({ id: entity.id });
  assertErrorResult(getResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
}
