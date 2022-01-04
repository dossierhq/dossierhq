import type { ErrorType, PublishedEntity } from '@jonasb/datadata-core';
import { copyEntity, ok } from '@jonasb/datadata-core';
import { assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { TITLE_ONLY_CREATE, TITLE_ONLY_PUBLISHED_ENTITY } from '../shared-entity/Fixtures';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite';

export const GetEntitiesSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  getEntities_minimal,
];

async function getEntities_minimal({ adminClient, publishedClient }: PublishedEntityTestContext) {
  const create1Result = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  const create2Result = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  if (assertOkResult(create1Result) && assertOkResult(create2Result)) {
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
}
