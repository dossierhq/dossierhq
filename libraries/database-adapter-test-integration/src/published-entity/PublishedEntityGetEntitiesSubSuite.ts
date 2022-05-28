import type { ErrorType, PublishedEntity } from '@jonasb/datadata-core';
import { copyEntity, notOk, ok } from '@jonasb/datadata-core';
import { assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import { TITLE_ONLY_CREATE, TITLE_ONLY_PUBLISHED_ENTITY } from '../shared-entity/Fixtures.js';
import {
  adminClientForMainPrincipal,
  adminClientForSecondaryPrincipal,
  publishedClientForMainPrincipal,
} from '../shared-entity/TestClients.js';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite.js';

export const GetEntitiesSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  getEntities_minimal,
  getEntities_none,
  getEntities_authKeySubjectOneCorrectOneWrong,
  getEntities_oneMissingOneExisting,
  getEntities_errorArchivedEntity,
];

async function getEntities_minimal({ adminClient, publishedClient }: PublishedEntityTestContext) {
  const create1Result = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  const create2Result = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(create1Result);
  assertOkResult(create2Result);
  const {
    entity: {
      id: id1,
      info: { name: name1, createdAt: createdAt1 },
    },
  } = create1Result.value;
  const {
    entity: {
      id: id2,
      info: { name: name2, createdAt: createdAt2 },
    },
  } = create2Result.value;

  const getResult = await publishedClient.getEntities([{ id: id1 }, { id: id2 }]);
  assertResultValue(getResult, [
    ok<PublishedEntity, ErrorType.Generic>(
      copyEntity(TITLE_ONLY_PUBLISHED_ENTITY, {
        id: id1,
        info: { name: name1, createdAt: createdAt1 },
      })
    ),
    ok<PublishedEntity, ErrorType.Generic>(
      copyEntity(TITLE_ONLY_PUBLISHED_ENTITY, {
        id: id2,
        info: { name: name2, createdAt: createdAt2 },
      })
    ),
  ]);
}

async function getEntities_none({ server }: PublishedEntityTestContext) {
  const result = await publishedClientForMainPrincipal(server).getEntities([]);
  assertResultValue(result, []);
}

async function getEntities_authKeySubjectOneCorrectOneWrong({
  server,
}: PublishedEntityTestContext) {
  const create1Result = await adminClientForSecondaryPrincipal(server).createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } }),
    { publish: true }
  );
  const create2Result = await adminClientForMainPrincipal(server).createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } }),
    { publish: true }
  );
  assertOkResult(create1Result);
  assertOkResult(create2Result);
  const {
    entity: { id: id1 },
  } = create1Result.value;
  const {
    entity: {
      id: id2,
      info: { name: name2, createdAt: createdAt2 },
    },
  } = create2Result.value;

  const getResult = await publishedClientForMainPrincipal(server).getEntities([
    { id: id1 },
    { id: id2 },
  ]);
  assertResultValue(getResult, [
    notOk.NotAuthorized('Wrong authKey provided'),
    ok<PublishedEntity, ErrorType.Generic>(
      copyEntity(TITLE_ONLY_PUBLISHED_ENTITY, {
        id: id2,
        info: { name: name2, createdAt: createdAt2, authKey: 'subject' },
      })
    ),
  ]);
}

async function getEntities_oneMissingOneExisting({ server }: PublishedEntityTestContext) {
  const createResult = await adminClientForMainPrincipal(server).createEntity(TITLE_ONLY_CREATE, {
    publish: true,
  });
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt },
    },
  } = createResult.value;

  const getResult = await publishedClientForMainPrincipal(server).getEntities([
    { id: 'f09fdd62-4a1e-4320-afba-8dd0781799df' },
    { id },
  ]);
  assertResultValue(getResult, [
    notOk.NotFound('No such entity'),
    ok<PublishedEntity, ErrorType.Generic>(
      copyEntity(TITLE_ONLY_PUBLISHED_ENTITY, { id, info: { name, createdAt } })
    ),
  ]);
}

async function getEntities_errorArchivedEntity({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const archiveResult = await adminClient.archiveEntity({ id });
  assertOkResult(archiveResult);

  const result = await publishedClient.getEntities([{ id }]);
  assertResultValue(result, [notOk.NotFound('No such entity')]);
}
