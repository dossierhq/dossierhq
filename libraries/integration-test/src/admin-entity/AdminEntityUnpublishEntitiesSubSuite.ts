import { AdminEntityStatus, copyEntity, ErrorType, EventType } from '@dossierhq/core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import { assertChangelogEventsConnection } from '../shared-entity/EventsTestUtils.js';
import { STRINGS_CREATE, TITLE_ONLY_CREATE } from '../shared-entity/Fixtures.js';
import {
  adminClientForMainPrincipal,
  adminClientForSecondaryPrincipal,
  publishedClientForMainPrincipal,
} from '../shared-entity/TestClients.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const UnpublishEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  unpublishEntities_minimal,
  unpublishEntities_unpublishEntitiesEvent,
  unpublishEntities_errorInvalidId,
  unpublishEntities_errorDuplicateIds,
  unpublishEntities_errorWrongAuthKey,
  unpublishEntities_errorUniqueIndexValue,
];

async function unpublishEntities_minimal({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const createResult = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const unpublishResult = await adminClient.unpublishEntities([{ id }]);
  assertOkResult(unpublishResult);
  const [{ updatedAt }] = unpublishResult.value;
  assertResultValue(unpublishResult, [
    {
      id,
      effect: 'unpublished',
      status: AdminEntityStatus.withdrawn,
      updatedAt,
    },
  ]);

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: { status: AdminEntityStatus.withdrawn, updatedAt, validPublished: null },
  });

  const getResult = await adminClient.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function unpublishEntities_unpublishEntitiesEvent({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);

  const createResult1 = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  const {
    entity: {
      id: id1,
      info: { name: name1, createdAt: createdAt1 },
    },
  } = createResult1.valueOrThrow();

  const createResult2 = await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true });
  const {
    entity: {
      id: id2,
      info: { name: name2 },
    },
  } = createResult2.valueOrThrow();

  const unpublishResult = await adminClient.unpublishEntities([{ id: id1 }, { id: id2 }]);
  const [{ updatedAt: updatedAt1 }, { updatedAt: updatedAt2 }] = unpublishResult.valueOrThrow();

  assertResultValue(unpublishResult, [
    {
      id: id1,
      effect: 'unpublished',
      status: AdminEntityStatus.withdrawn,
      updatedAt: updatedAt1,
    },
    {
      id: id2,
      effect: 'unpublished',
      status: AdminEntityStatus.withdrawn,
      updatedAt: updatedAt2,
    },
  ]);

  const connectionResult = await adminClient.getChangelogEvents({ entity: { id: id1 } });
  assertChangelogEventsConnection(connectionResult, [
    {
      type: EventType.createAndPublishEntity,
      createdAt: createdAt1,
      createdBy: '',
      entities: [{ id: id1, name: name1, version: 1, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
    {
      type: EventType.unpublishEntities,
      createdAt: updatedAt1,
      createdBy: '',
      entities: [
        { id: id1, name: name1, version: 1, type: 'TitleOnly' },
        { id: id2, name: name2, version: 1, type: 'TitleOnly' },
      ],
      unauthorizedEntityCount: 0,
    },
  ]);
}

async function unpublishEntities_errorInvalidId({ server }: AdminEntityTestContext) {
  const unpublishResult = await adminClientForMainPrincipal(server).unpublishEntities([
    { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290' },
  ]);
  assertErrorResult(
    unpublishResult,
    ErrorType.NotFound,
    'No such entities: b1bdcb61-e6aa-47ff-98d8-4cfe8197b290',
  );
}

async function unpublishEntities_errorDuplicateIds({ server }: AdminEntityTestContext) {
  const unpublishResult = await adminClientForMainPrincipal(server).unpublishEntities([
    { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290' },
    { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290' },
  ]);
  assertErrorResult(
    unpublishResult,
    ErrorType.BadRequest,
    'Duplicate ids: b1bdcb61-e6aa-47ff-98d8-4cfe8197b290',
  );
}

async function unpublishEntities_errorWrongAuthKey({ server }: AdminEntityTestContext) {
  const createResult = await adminClientForMainPrincipal(server).createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } }),
    { publish: true },
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const publishResult = await adminClientForSecondaryPrincipal(server).unpublishEntities([{ id }]);
  assertErrorResult(
    publishResult,
    ErrorType.NotAuthorized,
    `entity(${id}): Wrong authKey provided`,
  );
}

async function unpublishEntities_errorUniqueIndexValue({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);
  const unique = Math.random().toString();

  const createResult = await adminClient.createEntity(
    copyEntity(STRINGS_CREATE, { fields: { unique } }),
    { publish: true },
  );
  assertOkResult(createResult);

  const firstPublishedGetResult = await publishedClient.getEntity({
    index: 'stringsUnique',
    value: unique,
  });
  assertOkResult(firstPublishedGetResult);

  const unpublishResult = await adminClient.unpublishEntities([
    { id: createResult.value.entity.id },
  ]);
  assertOkResult(unpublishResult);

  const secondPublishedGetResult = await publishedClient.getEntity({
    index: 'stringsUnique',
    value: unique,
  });
  assertErrorResult(secondPublishedGetResult, ErrorType.NotFound, 'No such entity');
}
