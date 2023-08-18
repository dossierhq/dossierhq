import { copyEntity, ErrorType } from '@dossierhq/core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures.js';
import {
  adminClientForMainPrincipal,
  adminClientForSecondaryPrincipal,
  sessionForMainPrincipal,
} from '../shared-entity/TestClients.js';

export const GetEntityHistorySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getEntityHistory_minimal,
  getEntityHistory_updateAndPublish,
  getEntityHistory_errorInvalidId,
  getEntityHistory_errorWrongAuthKey,
];

async function getEntityHistory_minimal({ server }: AdminEntityTestContext) {
  const sessionResult = await sessionForMainPrincipal(server);
  assertOkResult(sessionResult);

  const context = sessionResult.value;
  const adminClient = server.createAdminClient(context);
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { createdAt },
    },
  } = createResult.value;

  const getResult = await adminClient.getEntityHistory({ id });
  assertResultValue(getResult, {
    id,
    versions: [
      {
        createdAt,
        createdBy: context.session.subjectId,
        published: false,
        version: 1,
      },
    ],
  });
}

async function getEntityHistory_updateAndPublish({ server }: AdminEntityTestContext) {
  const sessionResult = await sessionForMainPrincipal(server);
  assertOkResult(sessionResult);
  const context = sessionResult.value;
  const adminClient = server.createAdminClient(context);
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { createdAt },
    },
  } = createResult.value;

  const updateResult = await adminClient.updateEntity(
    { id, fields: { title: 'Updated title' } },
    { publish: true },
  );
  assertOkResult(updateResult);
  const {
    entity: {
      info: { updatedAt },
    },
  } = updateResult.value;

  const getResult = await adminClient.getEntityHistory({ id });
  assertResultValue(getResult, {
    id,
    versions: [
      {
        createdAt,
        createdBy: context.session.subjectId,
        published: false,
        version: 1,
      },
      {
        createdAt: updatedAt,
        createdBy: context.session.subjectId,
        published: true,
        version: 2,
      },
    ],
  });
}

async function getEntityHistory_errorInvalidId({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const result = await client.getEntityHistory({ id: '13e4c7da-616e-44a3-a039-24f96f9b17da' });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function getEntityHistory_errorWrongAuthKey({ server }: AdminEntityTestContext) {
  const createResult = await adminClientForMainPrincipal(server).createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      info: { authKey: 'subject' },
    }),
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await adminClientForSecondaryPrincipal(server).getEntityHistory({ id });
  assertErrorResult(getResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
}
