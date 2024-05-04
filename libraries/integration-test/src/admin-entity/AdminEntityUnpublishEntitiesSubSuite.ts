import { copyEntity, EntityStatus, ErrorType, EventType } from '@dossierhq/core';
import { assertErrorResult, assertOkResult, assertResultValue, assertSame } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import { assertChangelogEventsConnection } from '../shared-entity/EventsTestUtils.js';
import {
  REFERENCES_CREATE,
  STRINGS_CREATE,
  SUBJECT_ONLY_CREATE,
  TITLE_ONLY_CREATE,
} from '../shared-entity/Fixtures.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const UnpublishEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  unpublishEntities_minimal,
  unpublishEntities_unpublishEntitiesEvent,
  unpublishEntities_releasesName,
  unpublishEntities_draftEntity,
  unpublishEntities_withdrawnEntity,
  unpublishEntities_archivedEntity,
  unpublishEntities_twoPublishedEntitiesReferencingEachOther,
  unpublishEntities_errorInvalidId,
  unpublishEntities_errorDuplicateIds,
  unpublishEntities_errorWrongAuthKey,
  unpublishEntities_errorUniqueIndexValue,
  unpublishEntities_errorReadonlySession,
  unpublishEntities_errorReferencedByPublishedEntity,
];

async function unpublishEntities_minimal({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const { entity } = (
    await client.createEntity(TITLE_ONLY_CREATE, { publish: true })
  ).valueOrThrow();

  const unpublishResult = await client.unpublishEntities([{ id: entity.id }]);
  const [{ updatedAt }] = unpublishResult.valueOrThrow();
  assertResultValue(unpublishResult, [
    {
      id: entity.id,
      effect: 'unpublished',
      status: EntityStatus.withdrawn,
      updatedAt,
    },
  ]);

  const expectedEntity = copyEntity(entity, {
    info: { status: EntityStatus.withdrawn, updatedAt, validPublished: null },
  });

  const getResult = await client.getEntity({ id: entity.id });
  assertResultValue(getResult, expectedEntity);
}

async function unpublishEntities_unpublishEntitiesEvent({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  // Create two published entities

  const createResult1 = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Name 1' } }),
    { publish: true },
  );
  const {
    entity: {
      id: id1,
      info: { name: name1, createdAt: createdAt1 },
    },
  } = createResult1.valueOrThrow();

  const createResult2 = await client.createEntity(
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
  } = (await client.updateEntity({ id: id1, fields: { title: 'Updated' } })).valueOrThrow();

  // Unpublish
  const unpublishResult = await client.unpublishEntities([{ id: id1 }, { id: id2 }]);
  const [{ updatedAt: unpublishedAt1 }, { updatedAt: unpublishedAt2 }] =
    unpublishResult.valueOrThrow();

  assertResultValue(unpublishResult, [
    {
      id: id1,
      effect: 'unpublished',
      status: EntityStatus.withdrawn,
      updatedAt: unpublishedAt1,
    },
    {
      id: id2,
      effect: 'unpublished',
      status: EntityStatus.withdrawn,
      updatedAt: unpublishedAt2,
    },
  ]);

  // Check events
  const connectionResult = await client.getChangelogEvents({ entity: { id: id1 } });
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

async function unpublishEntities_releasesName({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const { entity: firstEntity } = (
    await client.createEntity(TITLE_ONLY_CREATE, { publish: true })
  ).valueOrThrow();

  assertOkResult(
    await client.updateEntity({ id: firstEntity.id, info: { name: 'Renamed' }, fields: {} }),
  );

  assertOkResult(await client.unpublishEntities([{ id: firstEntity.id }]));

  const { entity: secondEntity } = (
    await client.createEntity(
      copyEntity(TITLE_ONLY_CREATE, { info: { name: firstEntity.info.name } }),
      { publish: true },
    )
  ).valueOrThrow();

  // If unpublishing didn't release the name, this would fail
  assertSame(firstEntity.info.name, secondEntity.info.name);
}

async function unpublishEntities_draftEntity({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const { entity } = (await client.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();

  const unpublishResult = await client.unpublishEntities([{ id: entity.id }]);
  assertResultValue(unpublishResult, [
    {
      id: entity.id,
      effect: 'none',
      updatedAt: entity.info.updatedAt,
      status: EntityStatus.draft,
    },
  ]);
}

async function unpublishEntities_withdrawnEntity({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const { entity } = (
    await client.createEntity(TITLE_ONLY_CREATE, { publish: true })
  ).valueOrThrow();

  const firstUnpublishResult = await client.unpublishEntities([{ id: entity.id }]);
  assertOkResult(firstUnpublishResult);

  const secondUnpublishResult = await client.unpublishEntities([{ id: entity.id }]);
  assertResultValue(secondUnpublishResult, [
    {
      id: entity.id,
      effect: 'none',
      updatedAt: firstUnpublishResult.valueOrThrow()[0].updatedAt,
      status: EntityStatus.withdrawn,
    },
  ]);
}

async function unpublishEntities_archivedEntity({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const { entity } = (await client.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();

  const archiveResult = await client.archiveEntity({ id: entity.id });
  assertOkResult(archiveResult);

  const unpublishResult = await client.unpublishEntities([{ id: entity.id }]);
  assertResultValue(unpublishResult, [
    {
      id: entity.id,
      effect: 'none',
      updatedAt: archiveResult.valueOrThrow().updatedAt,
      status: EntityStatus.archived,
    },
  ]);
}

async function unpublishEntities_twoPublishedEntitiesReferencingEachOther({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  // Create entity1 and entity2, where entity2 --> entity1
  const { entity: entity1 } = (
    await client.createEntity(REFERENCES_CREATE, { publish: true })
  ).valueOrThrow();
  const { entity: entity2 } = (
    await client.createEntity(
      copyEntity(REFERENCES_CREATE, { fields: { any: { id: entity1.id } } }),
      { publish: true },
    )
  ).valueOrThrow();

  // Update entity1 --> entity2
  assertOkResult(
    await client.updateEntity(
      { id: entity1.id, fields: { any: { id: entity2.id } } },
      { publish: true },
    ),
  );

  const unpublishResult = await client.unpublishEntities([{ id: entity1.id }, { id: entity2.id }]);
  assertResultValue(unpublishResult, [
    {
      id: entity1.id,
      effect: 'unpublished',
      updatedAt: unpublishResult.valueOrThrow()[0].updatedAt,
      status: EntityStatus.withdrawn,
    },
    {
      id: entity2.id,
      effect: 'unpublished',
      updatedAt: unpublishResult.valueOrThrow()[1].updatedAt,
      status: EntityStatus.withdrawn,
    },
  ]);
}

async function unpublishEntities_errorInvalidId({ clientProvider }: AdminEntityTestContext) {
  const unpublishResult = await clientProvider
    .dossierClient()
    .unpublishEntities([{ id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290' }]);
  assertErrorResult(
    unpublishResult,
    ErrorType.NotFound,
    'No such entities: b1bdcb61-e6aa-47ff-98d8-4cfe8197b290',
  );
}

async function unpublishEntities_errorDuplicateIds({ clientProvider }: AdminEntityTestContext) {
  const unpublishResult = await clientProvider
    .dossierClient()
    .unpublishEntities([
      { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290' },
      { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290' },
    ]);
  assertErrorResult(
    unpublishResult,
    ErrorType.BadRequest,
    'Duplicate ids: b1bdcb61-e6aa-47ff-98d8-4cfe8197b290',
  );
}

async function unpublishEntities_errorWrongAuthKey({ clientProvider }: AdminEntityTestContext) {
  const createResult = await clientProvider.dossierClient().createEntity(SUBJECT_ONLY_CREATE, {
    publish: true,
  });
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const publishResult = await clientProvider.dossierClient('secondary').unpublishEntities([{ id }]);
  assertErrorResult(
    publishResult,
    ErrorType.NotAuthorized,
    `entity(${id}): Wrong authKey provided`,
  );
}

async function unpublishEntities_errorUniqueIndexValue({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const publishedClient = clientProvider.publishedClient();
  const unique = Math.random().toString();

  const createResult = await client.createEntity(
    copyEntity(STRINGS_CREATE, { fields: { unique } }),
    { publish: true },
  );
  assertOkResult(createResult);

  const firstPublishedGetResult = await publishedClient.getEntity({
    index: 'stringsUnique',
    value: unique,
  });
  assertOkResult(firstPublishedGetResult);

  const unpublishResult = await client.unpublishEntities([{ id: createResult.value.entity.id }]);
  assertOkResult(unpublishResult);

  const secondPublishedGetResult = await publishedClient.getEntity({
    index: 'stringsUnique',
    value: unique,
  });
  assertErrorResult(secondPublishedGetResult, ErrorType.NotFound, 'No such entity');
}

async function unpublishEntities_errorReadonlySession({ clientProvider }: AdminEntityTestContext) {
  const createResult = await clientProvider
    .dossierClient()
    .createEntity(TITLE_ONLY_CREATE, { publish: true });
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const unpublishResult = await clientProvider
    .dossierClient('main', 'readonly')
    .unpublishEntities([{ id }]);
  assertErrorResult(
    unpublishResult,
    ErrorType.BadRequest,
    'Readonly session used to unpublish entities',
  );
}

async function unpublishEntities_errorReferencedByPublishedEntity({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  // Create entity1 and entity2, where entity2 --> entity1
  const { entity: entity1 } = (
    await client.createEntity(REFERENCES_CREATE, { publish: true })
  ).valueOrThrow();
  const { entity: entity2 } = (
    await client.createEntity(
      copyEntity(REFERENCES_CREATE, { fields: { any: { id: entity1.id } } }),
      { publish: true },
    )
  ).valueOrThrow();

  const unpublishResult = await client.unpublishEntities([{ id: entity1.id }]);
  assertErrorResult(
    unpublishResult,
    ErrorType.BadRequest,
    `${entity1.id}: Published entities referencing entity: ${entity2.id}`,
  );
}
