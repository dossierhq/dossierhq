import { copyEntity, ErrorType, PublishingEventKind } from '@jonasb/datadata-core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures';
import {
  adminClientForMainPrincipal,
  adminClientForSecondaryPrincipal,
  sessionForMainPrincipal,
} from '../shared-entity/TestClients';

export const GetPublishingHistorySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  getPublishingHistory_minimal,
  getPublishingHistory_updateAndPublish,
  getPublishingHistory_errorInvalidId,
  getPublishingHistory_errorWrongAuthKey,
];

async function getPublishingHistory_minimal({ server }: AdminEntityTestContext) {
  const sessionResult = await sessionForMainPrincipal(server);
  assertOkResult(sessionResult);
  const context = sessionResult.value;
  const adminClient = server.createAdminClient(context);
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
  const sessionResult = await sessionForMainPrincipal(server);
  assertOkResult(sessionResult);
  const context = sessionResult.value;
  const adminClient = server.createAdminClient(context);
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);

  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await adminClient.updateEntity(
    { id, fields: { title: 'Updated title' } },
    { publish: true }
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
        kind: PublishingEventKind.Publish,
        publishedAt: updatedAt,
        publishedBy: context.session.subjectId,
        version: 1,
      },
    ],
  });
}

async function getPublishingHistory_errorInvalidId({ client }: AdminEntityTestContext) {
  const result = await client.getPublishingHistory({ id: '13e4c7da-616e-44a3-a039-24f96f9b17da' });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function getPublishingHistory_errorWrongAuthKey({ server }: AdminEntityTestContext) {
  const createResult = await adminClientForMainPrincipal(server).createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      info: { authKey: 'subject' },
    })
  );

  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await adminClientForSecondaryPrincipal(server).getPublishingHistory({ id });
  assertErrorResult(getResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
}
