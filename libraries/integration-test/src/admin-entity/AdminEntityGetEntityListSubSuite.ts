import type { ErrorType } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import { assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AppAdminEntity } from '../SchemaTypes.js';
import { SUBJECT_ONLY_CREATE, TITLE_ONLY_CREATE } from '../shared-entity/Fixtures.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const GetEntityListSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getEntityList_minimal,
  getEntityList_none,
  getEntityList_getLatestVersion,
  getEntityList_authKeySubjectOneCorrectOneWrong,
  getEntityList_errorAuthKeySubjectFromReadonlyRandom,
  getEntityList_oneMissingOneExisting,
];

async function getEntityList_minimal({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const create1Result = await client.createEntity(TITLE_ONLY_CREATE);
  const create2Result = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(create1Result);
  assertOkResult(create2Result);
  const {
    entity: { id: id1 },
  } = create1Result.value;
  const {
    entity: { id: id2 },
  } = create2Result.value;

  const getResult = await client.getEntityList([{ id: id1 }, { id: id2 }]);
  assertResultValue(getResult, [
    ok<AppAdminEntity, typeof ErrorType.Generic>(create1Result.value.entity),
    ok<AppAdminEntity, typeof ErrorType.Generic>(create2Result.value.entity),
  ]);
}

async function getEntityList_none({ clientProvider }: AdminEntityTestContext) {
  const result = await clientProvider.adminClient().getEntityList([]);
  assertResultValue(result, []);
}

async function getEntityList_getLatestVersion({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await adminClient.updateEntity({ id, fields: { title: 'Updated title' } });
  assertOkResult(updateResult);

  const result = await adminClient.getEntityList([{ id }]);
  assertOkResult(result);
  assertResultValue(result, [
    ok<AppAdminEntity, typeof ErrorType.Generic>(updateResult.value.entity),
  ]);
}

async function getEntityList_authKeySubjectOneCorrectOneWrong({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClientMain = clientProvider.adminClient();
  const create1Result = await clientProvider
    .adminClient('secondary')
    .createEntity(SUBJECT_ONLY_CREATE);
  const create2Result = await adminClientMain.createEntity(SUBJECT_ONLY_CREATE);
  assertOkResult(create1Result);
  assertOkResult(create2Result);
  const {
    entity: { id: id1 },
  } = create1Result.value;
  const {
    entity: { id: id2 },
  } = create2Result.value;

  const getResult = await adminClientMain.getEntityList([{ id: id1 }, { id: id2 }]);
  assertResultValue(getResult, [
    notOk.NotAuthorized('Wrong authKey provided'),
    ok<AppAdminEntity, typeof ErrorType.Generic>(create2Result.value.entity),
  ]);
}

async function getEntityList_errorAuthKeySubjectFromReadonlyRandom({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClientMain = clientProvider.adminClient();
  const { entity } = (await adminClientMain.createEntity(SUBJECT_ONLY_CREATE)).valueOrThrow();

  const getResult = await clientProvider
    .adminClient('random', 'readonly')
    .getEntityList([{ id: entity.id }]);
  assertResultValue(getResult, [notOk.NotAuthorized('Wrong authKey provided')]);
}

async function getEntityList_oneMissingOneExisting({ clientProvider }: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await adminClient.getEntityList([
    { id: 'f09fdd62-4a1e-4320-afba-8dd0781799df' },
    { id },
  ]);
  assertResultValue(getResult, [
    notOk.NotFound('No such entity'),
    ok<AppAdminEntity, typeof ErrorType.Generic>(createResult.value.entity),
  ]);
}
