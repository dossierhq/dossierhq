import { copyEntity, ErrorType, PublishingEventKind } from '@dossierhq/core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures.js';
import {
  adminClientForMainPrincipal,
  adminClientForSecondaryPrincipal,
  sessionForMainPrincipal,
} from '../shared-entity/TestClients.js';

export const GetPublishingHistorySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getPublishingHistory_minimal,
  getPublishingHistory_updateAndPublish,
  getPublishingHistory_errorInvalidId,
  getPublishingHistory_errorWrongAuthKey,
];

async function getPublishingHistory_minimal({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);

  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await adminClient.getPublishingHistory({ id });
  assertResultValue(getResult, {
    id,
    events: [],
  });
}

async function getPublishingHistory_updateAndPublish({ server }: AdminEntityTestContext) {
  const context = (await sessionForMainPrincipal(server)).valueOrThrow();
  const adminClient = server.createAdminClient(context);
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);

  assertOkResult(createResult);
  const {
    entity: { id },
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

  const getResult = await adminClient.getPublishingHistory({ id });
  assertResultValue(getResult, {
    id,
    events: [
      {
        kind: PublishingEventKind.publish,
        publishedAt: updatedAt,
        publishedBy: context.session.subjectId,
        version: 2,
      },
    ],
  });
}

async function getPublishingHistory_errorInvalidId({ server }: AdminEntityTestContext) {
  const client = adminClientForMainPrincipal(server);
  const result = await client.getPublishingHistory({ id: '13e4c7da-616e-44a3-a039-24f96f9b17da' });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function getPublishingHistory_errorWrongAuthKey({ server }: AdminEntityTestContext) {
  const createResult = await adminClientForMainPrincipal(server).createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      info: { authKey: 'subject' },
    }),
  );

  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await adminClientForSecondaryPrincipal(server).getPublishingHistory({ id });
  assertErrorResult(getResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
}
