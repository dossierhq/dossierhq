import { copyEntity, ErrorType } from '@jonasb/datadata-core';
import { assertEquals, assertErrorResult, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdminTitleOnly } from '../SchemaTypes.js';
import { assertIsAdminTitleOnly } from '../SchemaTypes.js';
import { STRINGS_CREATE, TITLE_ONLY_CREATE } from '../shared-entity/Fixtures.js';
import {
  adminClientForMainPrincipal,
  adminClientForSecondaryPrincipal,
} from '../shared-entity/TestClients.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const GetEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getEntity_withSubjectAuthKey,
  getEntity_getLatestVersion,
  getEntity_usingUniqueIndex,
  getEntity_errorInvalidId,
  getEntity_errorInvalidVersion,
  getEntity_errorWrongAuthKey,
];

async function getEntity_withSubjectAuthKey({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity<AdminTitleOnly>(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
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

async function getEntity_getLatestVersion({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
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

async function getEntity_usingUniqueIndex({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const unique = Math.random().toString();
  const createResult = await adminClient.createEntity(
    copyEntity(STRINGS_CREATE, { fields: { unique } })
  );
  assertOkResult(createResult);

  const result = await adminClient.getEntity({ index: 'strings-unique', value: unique });
  assertOkResult(result);
  assertResultValue(result, createResult.value.entity);
}

async function getEntity_errorInvalidId({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const result = await client.getEntity({ id: '13e4c7da-616e-44a3-a039-24f96f9b17da' });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function getEntity_errorInvalidVersion({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);

  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const resultMinusOne = await client.getEntity({ id, version: -1 });
  assertErrorResult(resultMinusOne, ErrorType.NotFound, 'No such entity or version');

  const resultOne = await client.getEntity({ id, version: 1 });
  assertErrorResult(resultOne, ErrorType.NotFound, 'No such entity or version');
}

async function getEntity_errorWrongAuthKey({ server }: AdminEntityTestContext) {
  const createResult = await adminClientForMainPrincipal(server).createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      info: { authKey: 'subject' },
    })
  );

  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await adminClientForSecondaryPrincipal(server).getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
}
