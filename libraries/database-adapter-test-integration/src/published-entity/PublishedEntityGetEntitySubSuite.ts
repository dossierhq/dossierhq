import { AdminEntityStatus, copyEntity, ErrorType } from '@jonasb/datadata-core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import { TITLE_ONLY_CREATE, TITLE_ONLY_PUBLISHED_ENTITY } from '../shared-entity/Fixtures.js';
import {
  adminClientForMainPrincipal,
  publishedClientForMainPrincipal,
  publishedClientForSecondaryPrincipal,
} from '../shared-entity/TestClients.js';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite.js';

export const GetEntitySubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  getEntity_withSubjectAuthKey,
  getEntity_archivedThenPublished,
  getEntity_oldVersion,
  getEntity_errorInvalidId,
  getEntity_errorWrongAuthKey,
  getEntity_errorArchivedEntity,
];

async function getEntity_withSubjectAuthKey({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);
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

async function getEntity_archivedThenPublished({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, version },
    },
  } = createResult.value;

  const archiveResult = await adminClient.archiveEntity({ id });
  assertOkResult(archiveResult);

  const publishResult = await adminClient.publishEntities([{ id, version }]);
  assertOkResult(publishResult);

  const getResult = await publishedClientForMainPrincipal(server).getEntity({ id });
  assertResultValue(
    getResult,
    copyEntity(TITLE_ONLY_PUBLISHED_ENTITY, { id, info: { name, createdAt } })
  );
}

async function getEntity_oldVersion({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt },
    },
  } = createResult.value;

  const updateResult = await adminClient.updateEntity({ id, fields: { title: 'Updated title' } });
  assertOkResult(updateResult);

  const publishResult = await adminClient.publishEntities([{ id, version: 0 }]);
  assertOkResult(publishResult);
  const [{ updatedAt }] = publishResult.value;
  assertResultValue(publishResult, [
    {
      id,
      effect: 'published',
      status: AdminEntityStatus.modified,
      updatedAt,
    },
  ]);

  const getResult = await publishedClientForMainPrincipal(server).getEntity({ id });
  assertResultValue(
    getResult,
    copyEntity(TITLE_ONLY_PUBLISHED_ENTITY, {
      id,
      info: { name, createdAt },
      fields: { title: createResult.value.entity.fields.title },
    })
  );
}

async function getEntity_errorInvalidId({ server }: PublishedEntityTestContext) {
  const publishedClient = publishedClientForMainPrincipal(server);
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
