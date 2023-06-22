import type { ErrorType } from '@dossierhq/core';
import { copyEntity, notOk, ok } from '@dossierhq/core';
import { assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AppAdminEntity } from '../SchemaTypes.js';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures.js';
import {
  adminClientForMainPrincipal,
  adminClientForSecondaryPrincipal,
} from '../shared-entity/TestClients.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const GetEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getEntities_minimal,
  getEntities_none,
  getEntities_getLatestVersion,
  getEntities_authKeySubjectOneCorrectOneWrong,
  getEntities_oneMissingOneExisting,
];

async function getEntities_minimal({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
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

  const getResult = await client.getEntities([{ id: id1 }, { id: id2 }]);
  assertResultValue(getResult, [
    ok<AppAdminEntity, typeof ErrorType.Generic>(create1Result.value.entity),
    ok<AppAdminEntity, typeof ErrorType.Generic>(create2Result.value.entity),
  ]);
}

async function getEntities_none({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).getEntities([]);
  assertResultValue(result, []);
}

async function getEntities_getLatestVersion({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await adminClient.updateEntity({ id, fields: { title: 'Updated title' } });
  assertOkResult(updateResult);

  const result = await adminClient.getEntities([{ id }]);
  assertOkResult(result);
  assertResultValue(result, [
    ok<AppAdminEntity, typeof ErrorType.Generic>(updateResult.value.entity),
  ]);
}

async function getEntities_authKeySubjectOneCorrectOneWrong({ server }: AdminEntityTestContext) {
  const adminClientMain = adminClientForMainPrincipal(server);
  const create1Result = await adminClientForSecondaryPrincipal(server).createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  const create2Result = await adminClientMain.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  assertOkResult(create1Result);
  assertOkResult(create2Result);
  const {
    entity: { id: id1 },
  } = create1Result.value;
  const {
    entity: { id: id2 },
  } = create2Result.value;

  const getResult = await adminClientMain.getEntities([{ id: id1 }, { id: id2 }]);
  assertResultValue(getResult, [
    notOk.NotAuthorized('Wrong authKey provided'),
    ok<AppAdminEntity, typeof ErrorType.Generic>(create2Result.value.entity),
  ]);
}

async function getEntities_oneMissingOneExisting({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await adminClient.getEntities([
    { id: 'f09fdd62-4a1e-4320-afba-8dd0781799df' },
    { id },
  ]);
  assertResultValue(getResult, [
    notOk.NotFound('No such entity'),
    ok<AppAdminEntity, typeof ErrorType.Generic>(createResult.value.entity),
  ]);
}
