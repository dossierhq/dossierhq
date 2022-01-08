import { copyEntity, ErrorType } from '@jonasb/datadata-core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { TITLE_ONLY_CREATE, TITLE_ONLY_PUBLISHED_ENTITY } from '../shared-entity/Fixtures';
import {
  adminClientForMainPrincipal,
  publishedClientForMainPrincipal,
  publishedClientForSecondaryPrincipal,
} from '../shared-entity/TestClients';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite';

export const GetEntitySubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  getEntity_withSubjectAuthKey,
  getEntity_errorInvalidId,
  getEntity_errorWrongAuthKey,
  getEntity_errorArchivedEntity,
];

async function getEntity_withSubjectAuthKey({
  adminClient,
  publishedClient,
}: PublishedEntityTestContext) {
  const createResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } }),
    { publish: true }
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt },
    },
  } = createResult.value;

  const getResult = await publishedClient.getEntity({ id });
  assertResultValue(
    getResult,
    copyEntity(TITLE_ONLY_PUBLISHED_ENTITY, {
      id,
      info: { authKey: 'subject', name, createdAt },
    })
  );
}

async function getEntity_errorInvalidId({ publishedClient }: PublishedEntityTestContext) {
  const result = await publishedClient.getEntity({ id: '13e4c7da-616e-44a3-a039-24f96f9b17da' });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function getEntity_errorWrongAuthKey({ server }: PublishedEntityTestContext) {
  const createResult = await adminClientForMainPrincipal(server).createEntity(
    copyEntity(TITLE_ONLY_CREATE, {
      info: { authKey: 'subject' },
    }),
    { publish: true }
  );

  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await publishedClientForSecondaryPrincipal(server).getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
}

async function getEntity_errorArchivedEntity({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const archiveResult = await adminClient.archiveEntity({ id });
  assertOkResult(archiveResult);

  const result = await publishedClient.getEntity({ id });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}
