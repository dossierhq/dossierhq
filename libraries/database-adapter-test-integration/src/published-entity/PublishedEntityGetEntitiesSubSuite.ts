import type { ErrorType, PublishedEntity } from '@jonasb/datadata-core';
import { copyEntity, notOk, ok } from '@jonasb/datadata-core';
import { assertEquals, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import { adminToPublishedEntity, TITLE_ONLY_CREATE } from '../shared-entity/Fixtures.js';
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

async function getEntities_minimal({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);
  const create1Result = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  const create2Result = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(create1Result);
  assertOkResult(create2Result);
  const {
    entity: { id: id1 },
  } = create1Result.value;
  const {
    entity: { id: id2 },
  } = create2Result.value;

  const getResult = await publishedClient.getEntities([{ id: id1 }, { id: id2 }]);
  assertOkResult(getResult);
  const [get1Result, get2Result] = getResult.value;
  assertOkResult(get1Result);
  assertOkResult(get2Result);
  assertEquals(get1Result.value, adminToPublishedEntity(create1Result.value.entity));
  assertEquals(get2Result.value, adminToPublishedEntity(create2Result.value.entity));
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
    entity: { id: id2 },
  } = create2Result.value;

  const getResult = await publishedClientForMainPrincipal(server).getEntities([
    { id: id1 },
    { id: id2 },
  ]);
  assertResultValue(getResult, [
    notOk.NotAuthorized('Wrong authKey provided'),
    ok<PublishedEntity, typeof ErrorType.Generic>(
      adminToPublishedEntity(create2Result.value.entity)
    ),
  ]);
}

async function getEntities_oneMissingOneExisting({ server }: PublishedEntityTestContext) {
  const createResult = await adminClientForMainPrincipal(server).createEntity(TITLE_ONLY_CREATE, {
    publish: true,
  });
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await publishedClientForMainPrincipal(server).getEntities([
    { id: 'f09fdd62-4a1e-4320-afba-8dd0781799df' },
    { id },
  ]);
  assertResultValue(getResult, [
    notOk.NotFound('No such entity'),
    ok<PublishedEntity, typeof ErrorType.Generic>(
      adminToPublishedEntity(createResult.value.entity)
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
