import {
  copyEntity,
  createRichText,
  createRichTextEntityLinkNode,
  createRichTextParagraphNode,
  createRichTextTextNode,
  EntityStatus,
  ErrorType,
  EventType,
} from '@dossierhq/core';
import { assertErrorResult, assertOkResult, assertResultValue, assertSame } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { AdminOnlyComponent, References, TitleOnly } from '../SchemaTypes.js';
import { assertChangelogEventsConnection } from '../shared-entity/EventsTestUtils.js';
import {
  REFERENCES_CREATE,
  RICH_TEXTS_CREATE,
  SUBJECT_ONLY_CREATE,
  TITLE_ONLY_CREATE,
  VALUE_ITEMS_CREATE,
} from '../shared-entity/Fixtures.js';
import { createInvalidEntity } from '../shared-entity/InvalidEntityUtils.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const PublishEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  publishEntities_minimal,
  publishEntities_authKeySubject,
  publishEntities_oldVersion,
  publishEntities_twoEntitiesReferencingEachOther,
  publishEntities_publishAlreadyPublishedEntity,
  publishEntities_publishWithAdminOnlyFieldReferencingDraftEntity,
  publishEntities_adminOnlyFieldWithAdminOnlyComponent,
  publishEntities_publishEntitiesEvent,
  publishEntities_fixInvalidEntityByPublishing,
  publishEntities_errorInvalidId,
  publishEntities_errorDuplicateIds,
  publishEntities_errorMissingRequiredTitle,
  publishEntities_errorWrongAuthKey,
  publishEntities_errorAdminOnlyComponent,
  publishEntities_errorReferencingUnpublishedEntityInRichTextEntityLinkNode,
  publishEntities_errorPublishInvalidEntity,
  publishEntities_errorPublishAlreadyPublishedInvalidEntity,
  publishEntities_errorReadonlySession,
];

async function publishEntities_minimal({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const { entity } = (await client.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();
  const {
    id,
    info: { version },
  } = entity;

  const publishResult = await client.publishEntities([{ id, version }]);
  assertOkResult(publishResult);
  const [{ updatedAt }] = publishResult.value;
  assertResultValue(publishResult, [
    {
      id,
      effect: 'published',
      status: EntityStatus.published,
      updatedAt,
    },
  ]);

  const expectedEntity = copyEntity(entity, {
    info: { status: EntityStatus.published, updatedAt, validPublished: true },
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function publishEntities_authKeySubject({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(SUBJECT_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.valueOrThrow();

  const publishResult = await client.publishEntities([{ id, version }]);
  assertOkResult(publishResult);
  const [{ updatedAt }] = publishResult.value;
  assertResultValue(publishResult, [
    {
      id,
      effect: 'published',
      status: EntityStatus.published,
      updatedAt,
    },
  ]);

  const expectedEntity = copyEntity(createResult.value.entity, {
    info: { status: EntityStatus.published, updatedAt, validPublished: true },
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function publishEntities_oldVersion({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });
  assertOkResult(updateResult);

  const publishResult = await client.publishEntities([{ id, version: 1 }]);
  assertOkResult(publishResult);
  const [{ updatedAt }] = publishResult.value;
  assertResultValue(publishResult, [
    {
      id,
      effect: 'published',
      status: EntityStatus.modified,
      updatedAt,
    },
  ]);

  const expectedEntity = copyEntity(updateResult.value.entity, {
    info: { status: EntityStatus.modified, updatedAt, validPublished: true },
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function publishEntities_twoEntitiesReferencingEachOther({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const create1Result = await client.createEntity(REFERENCES_CREATE);
  assertOkResult(create1Result);
  const {
    entity: { id: id1 },
  } = create1Result.value;

  const create2Result = await client.createEntity(
    copyEntity(REFERENCES_CREATE, { fields: { any: { id: id1 } } }),
  );
  assertOkResult(create2Result);
  const {
    entity: { id: id2 },
  } = create2Result.value;

  const update1Result = await client.updateEntity<References>({
    id: id1,
    fields: { any: { id: id2 } },
  });
  assertOkResult(update1Result);

  const publishResult = await client.publishEntities([
    { id: id1, version: 2 },
    { id: id2, version: 1 },
  ]);
  assertOkResult(publishResult);
  const [{ updatedAt: updatedAt1 }, { updatedAt: updatedAt2 }] = publishResult.value;
  assertResultValue(publishResult, [
    {
      id: id1,
      effect: 'published',
      status: EntityStatus.published,
      updatedAt: updatedAt1,
    },
    {
      id: id2,
      effect: 'published',
      status: EntityStatus.published,
      updatedAt: updatedAt2,
    },
  ]);

  const expected1Entity = copyEntity(update1Result.value.entity, {
    info: { status: EntityStatus.published, updatedAt: updatedAt1, validPublished: true },
  });

  const getResult = await client.getEntity({ id: id1 });
  assertResultValue(getResult, expected1Entity);
}

async function publishEntities_publishAlreadyPublishedEntity({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(TITLE_ONLY_CREATE, { publish: true });
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const updateResult = await client.updateEntity<TitleOnly>({
    id,
    fields: { title: 'Updated title' },
  });
  assertOkResult(updateResult);
  const {
    entity: {
      info: { version },
    },
  } = updateResult.value;

  const publishResult = await client.publishEntities([{ id, version }]);
  assertOkResult(publishResult);
  const [{ updatedAt }] = publishResult.value;
  assertResultValue(publishResult, [
    {
      id,
      effect: 'published',
      status: EntityStatus.published,
      updatedAt,
    },
  ]);

  const expectedEntity = copyEntity(updateResult.value.entity, {
    info: { status: EntityStatus.published, updatedAt },
  });

  const getResult = await client.getEntity({ id });
  assertResultValue(getResult, expectedEntity);
}

async function publishEntities_publishWithAdminOnlyFieldReferencingDraftEntity({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const {
    entity: { id: draftId },
  } = (await client.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();

  const {
    entity: {
      id,
      info: { version },
    },
  } = (
    await client.createEntity(
      copyEntity(REFERENCES_CREATE, { fields: { anyAdminOnly: { id: draftId } } }),
    )
  ).valueOrThrow();

  const publishResult = await client.publishEntities([{ id, version }]);
  assertOkResult(publishResult);
}

async function publishEntities_adminOnlyFieldWithAdminOnlyComponent({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const adminOnlyComponent: AdminOnlyComponent = { type: 'AdminOnlyComponent' };
  const createResult = await client.createEntity(
    copyEntity(VALUE_ITEMS_CREATE, { fields: { anyAdminOnly: adminOnlyComponent } }),
  );
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.valueOrThrow();

  const publishResult = await client.publishEntities([{ id, version }]);
  assertOkResult(publishResult);
}

async function publishEntities_publishEntitiesEvent({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const createResult1 = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Name 1' } }),
  );
  const {
    entity: {
      id: id1,
      info: { version: version1, name: name1, createdAt: createdAt1 },
    },
  } = createResult1.valueOrThrow();

  const createResult2 = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Name 2' } }),
  );
  const {
    entity: {
      id: id2,
      info: { version: version2, name: name2 },
    },
  } = createResult2.valueOrThrow();

  const publishResult = await client.publishEntities([
    { id: id1, version: version1 },
    { id: id2, version: version2 },
  ]);
  const [{ updatedAt: updatedAt1 }, { updatedAt: updatedAt2 }] = publishResult.valueOrThrow();
  assertResultValue(publishResult, [
    {
      id: id1,
      effect: 'published',
      status: EntityStatus.published,
      updatedAt: updatedAt1,
    },
    {
      id: id2,
      effect: 'published',
      status: EntityStatus.published,
      updatedAt: updatedAt2,
    },
  ]);

  const connectionResult = await client.getChangelogEvents({ entity: { id: id1 } });
  assertChangelogEventsConnection(connectionResult, [
    {
      type: EventType.createEntity,
      createdAt: createdAt1,
      createdBy: '',
      entities: [{ id: id1, name: name1, version: version1, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
    {
      type: EventType.publishEntities,
      createdAt: updatedAt1,
      createdBy: '',
      entities: [
        { id: id1, name: name1, version: version1, type: 'TitleOnly' },
        { id: id2, name: name2, version: version2, type: 'TitleOnly' },
      ],
      unauthorizedEntityCount: 0,
    },
  ]);
}

async function publishEntities_fixInvalidEntityByPublishing({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const {
    entity: { id: entityId },
  } = (await createInvalidEntity(client, { required: null }, { publish: true })).valueOrThrow();

  const entity = (await client.getEntity({ id: entityId })).valueOrThrow();
  assertSame(entity.info.valid, true);
  assertSame(entity.info.validPublished, false);

  const { entity: updatedEntity } = (
    await client.updateEntity({ id: entity.id, fields: { required: 'Required' } })
  ).valueOrThrow();

  const publishResult = await client.publishEntities([
    { id: entity.id, version: updatedEntity.info.version },
  ]);
  assertOkResult(publishResult);
}

async function publishEntities_errorInvalidId({ clientProvider }: AdminEntityTestContext) {
  const publishResult = await clientProvider
    .dossierClient()
    .publishEntities([{ id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290', version: 1 }]);
  assertErrorResult(
    publishResult,
    ErrorType.NotFound,
    'No such entities: b1bdcb61-e6aa-47ff-98d8-4cfe8197b290',
  );
}

async function publishEntities_errorDuplicateIds({ clientProvider }: AdminEntityTestContext) {
  const publishResult = await clientProvider.dossierClient().publishEntities([
    { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290', version: 1 },
    { id: 'b1bdcb61-e6aa-47ff-98d8-4cfe8197b290', version: 1 },
  ]);
  assertErrorResult(
    publishResult,
    ErrorType.BadRequest,
    'Duplicate ids: b1bdcb61-e6aa-47ff-98d8-4cfe8197b290',
  );
}

async function publishEntities_errorMissingRequiredTitle({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { fields: { title: null } }),
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.value;

  const publishResult = await client.publishEntities([{ id, version }]);
  assertErrorResult(
    publishResult,
    ErrorType.BadRequest,
    `entity(${id}).fields.title: Required field is empty`,
  );
}

async function publishEntities_errorWrongAuthKey({ clientProvider }: AdminEntityTestContext) {
  const createResult = await clientProvider.dossierClient().createEntity(SUBJECT_ONLY_CREATE);
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.valueOrThrow();

  const publishResult = await clientProvider
    .dossierClient('secondary')
    .publishEntities([{ id, version }]);
  assertErrorResult(
    publishResult,
    ErrorType.NotAuthorized,
    `entity(${id}): Wrong authKey provided`,
  );
}

async function publishEntities_errorAdminOnlyComponent({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const adminOnlyComponent: AdminOnlyComponent = { type: 'AdminOnlyComponent' };
  const createResult = await client.createEntity(
    copyEntity(VALUE_ITEMS_CREATE, { fields: { any: adminOnlyComponent } }),
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { version },
    },
  } = createResult.value;

  const publishResult = await client.publishEntities([{ id, version }]);
  assertErrorResult(
    publishResult,
    ErrorType.BadRequest,
    `entity(${id}).fields.any: Component of type AdminOnlyComponent is adminOnly`,
  );
}

async function publishEntities_errorReferencingUnpublishedEntityInRichTextEntityLinkNode({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const {
    entity: { id: titleOnlyId },
  } = (await client.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();

  const {
    entity: {
      id: richTextId,
      info: { version },
    },
  } = (
    await client.createEntity(
      copyEntity(RICH_TEXTS_CREATE, {
        fields: {
          richText: createRichText([
            createRichTextParagraphNode([
              createRichTextEntityLinkNode({ id: titleOnlyId }, [
                createRichTextTextNode('link text'),
              ]),
            ]),
          ]),
        },
      }),
    )
  ).valueOrThrow();
  const publishResult = await client.publishEntities([{ id: richTextId, version }]);
  assertErrorResult(
    publishResult,
    ErrorType.BadRequest,
    `${richTextId}: References unpublished entities: ${titleOnlyId}`,
  );
}

async function publishEntities_errorPublishInvalidEntity({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const { entity } = (
    await createInvalidEntity(client, {
      required: 'Required',
      matchPattern: 'no match',
    })
  ).valueOrThrow();

  // Even though the entity has been made valid in later version, the old version will still fail to publish
  const { entity: updatedEntity } = (
    await client.updateEntity({ id: entity.id, fields: { matchPattern: 'foo' } })
  ).valueOrThrow();
  assertSame(updatedEntity.info.valid, true);
  assertSame(updatedEntity.info.validPublished, null);

  const publishResult = await client.publishEntities([{ id: entity.id, version: 1 }]);
  assertErrorResult(
    publishResult,
    ErrorType.BadRequest,
    `entity(${entity.id}).fields.matchPattern: Value does not match pattern fooBarBaz`,
  );
}

async function publishEntities_errorPublishAlreadyPublishedInvalidEntity({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const { entity } = (
    await createInvalidEntity(client, { required: null }, { publish: true })
  ).valueOrThrow();

  const publishResult = await client.publishEntities([{ id: entity.id, version: 1 }]);
  assertErrorResult(
    publishResult,
    ErrorType.BadRequest,
    `entity(${entity.id}): Already published version is invalid`,
  );
}

async function publishEntities_errorReadonlySession({ clientProvider }: AdminEntityTestContext) {
  const normalClient = clientProvider.dossierClient('main', 'write');
  const readonlyClient = clientProvider.dossierClient('main', 'readonly');
  const { entity } = (await normalClient.createEntity(TITLE_ONLY_CREATE)).valueOrThrow();

  const publishResult = await readonlyClient.publishEntities([{ id: entity.id, version: 1 }]);
  assertErrorResult(
    publishResult,
    ErrorType.BadRequest,
    'Readonly session used to publish entities',
  );
}
