import type { ErrorType, PublishedEntity } from '@jonasb/datadata-core';
import { copyEntity, notOk, ok } from '@jonasb/datadata-core';
import { assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { TITLE_ONLY_CREATE, TITLE_ONLY_PUBLISHED_ENTITY } from '../shared-entity/Fixtures';
import { publishedClientForMainPrincipal } from '../shared-entity/TestClients';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite';

export const GetEntitiesSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  getEntities_minimal,
  getEntities_none,
  getEntities_errorMissingIds,
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

async function getEntities_errorMissingIds({ server }: PublishedEntityTestContext) {
  const getResult = await publishedClientForMainPrincipal(server).getEntities([
    { id: 'f09fdd62-4a1e-4320-afba-8dd0781799df' },
    { id: 'f09fdd62-4a1e-4320-4320-8dd0781799df' },
  ]);
  assertResultValue(getResult, [
    notOk.NotFound('No such entity'),
    notOk.NotFound('No such entity'),
  ]);
}
