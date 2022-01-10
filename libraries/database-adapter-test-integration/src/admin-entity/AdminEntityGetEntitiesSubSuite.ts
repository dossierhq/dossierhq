import type { AdminEntity, ErrorType } from '@jonasb/datadata-core';
import { copyEntity, notOk, ok } from '@jonasb/datadata-core';
import { assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures';
import {
  adminClientForMainPrincipal,
  adminClientForSecondaryPrincipal,
} from '../shared-entity/TestClients';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

export const GetEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getEntities_minimal,
  getEntities_none,
  getEntities_getLatestVersion,
  getEntities_authKeySubjectOneCorrectOneWrong,
  getEntities_errorMissingIds,
];

async function getEntities_minimal({ client }: AdminEntityTestContext) {
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
    ok<AdminEntity, ErrorType.Generic>(create1Result.value.entity),
    ok<AdminEntity, ErrorType.Generic>(create2Result.value.entity),
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
  assertResultValue(result, [ok<AdminEntity, ErrorType.Generic>(updateResult.value.entity)]);
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
    ok<AdminEntity, ErrorType.Generic>(create2Result.value.entity),
  ]);
}

async function getEntities_errorMissingIds({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).getEntities([
    { id: '13e4c7da-616e-44a3-a039-24f96f9b17da' },
    { id: '13e4c7da-616e-44a3-44a3-24f96f9b17da' },
  ]);
  assertResultValue(result, [notOk.NotFound('No such entity'), notOk.NotFound('No such entity')]);
}
