import { AdminEntityStatus, copyEntity, ErrorType, EventType } from '@dossierhq/core';
import { assertErrorResult, assertOkResult, assertResultValue, assertSame } from '../Asserts.js';
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
  unpublishEntities_releasesName,
  unpublishEntities_errorInvalidId,
  unpublishEntities_errorDuplicateIds,
  unpublishEntities_errorWrongAuthKey,
  unpublishEntities_errorUniqueIndexValue,
];

async function unpublishEntities_minimal({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);

  const { entity } = (
    await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true })
  ).valueOrThrow();

  const unpublishResult = await adminClient.unpublishEntities([{ id: entity.id }]);
  const [{ updatedAt }] = unpublishResult.valueOrThrow();
  assertResultValue(unpublishResult, [
    {
      id: entity.id,
      effect: 'unpublished',
      status: AdminEntityStatus.withdrawn,
      updatedAt,
    },
  ]);

  const expectedEntity = copyEntity(entity, {
    info: { status: AdminEntityStatus.withdrawn, updatedAt, validPublished: null },
  });

  const getResult = await adminClient.getEntity({ id: entity.id });
  assertResultValue(getResult, expectedEntity);
}

async function unpublishEntities_unpublishEntitiesEvent({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);

  // Create two published entities

  const createResult1 = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Name 1' } }),
    { publish: true },
  );
  const {
    entity: {
      id: id1,
      info: { name: name1, createdAt: createdAt1 },
    },
  } = createResult1.valueOrThrow();

  const createResult2 = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Name 2' } }),
    { publish: true },
  );
  const {
    entity: {
      id: id2,
      info: { name: name2 },
    },
  } = createResult2.valueOrThrow();

  // Update one of the entities (so that we can check that it's the right version we get the in the event)
  const {
    entity: {
      info: { updatedAt: updatedAt1 },
    },
  } = (await adminClient.updateEntity({ id: id1, fields: { title: 'Updated' } })).valueOrThrow();

  // Unpublish
  const unpublishResult = await adminClient.unpublishEntities([{ id: id1 }, { id: id2 }]);
  const [{ updatedAt: unpublishedAt1 }, { updatedAt: unpublishedAt2 }] =
    unpublishResult.valueOrThrow();

  assertResultValue(unpublishResult, [
    {
      id: id1,
      effect: 'unpublished',
      status: AdminEntityStatus.withdrawn,
      updatedAt: unpublishedAt1,
    },
    {
      id: id2,
      effect: 'unpublished',
      status: AdminEntityStatus.withdrawn,
      updatedAt: unpublishedAt2,
    },
  ]);

  // Check events
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
      type: EventType.updateEntity,
      createdAt: updatedAt1,
      createdBy: '',
      entities: [{ id: id1, name: name1, version: 2, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
    {
      type: EventType.unpublishEntities,
      createdAt: unpublishedAt1,
      createdBy: '',
      entities: [
        { id: id1, name: name1, version: 1, type: 'TitleOnly' },
        { id: id2, name: name2, version: 1, type: 'TitleOnly' },
      ],
      unauthorizedEntityCount: 0,
    },
  ]);
}

async function unpublishEntities_releasesName({ server }: AdminEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);

  const { entity: firstEntity } = (
    await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true })
  ).valueOrThrow();

  assertOkResult(
    await adminClient.updateEntity({ id: firstEntity.id, info: { name: 'Renamed' }, fields: {} }),
  );

  assertOkResult(await adminClient.unpublishEntities([{ id: firstEntity.id }]));

  const { entity: secondEntity } = (
    await adminClient.createEntity(
      copyEntity(TITLE_ONLY_CREATE, { info: { name: firstEntity.info.name } }),
      { publish: true },
    )
  ).valueOrThrow();

  // If unpublishing didn't release the name, this would fail
  assertSame(firstEntity.info.name, secondEntity.info.name);
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
