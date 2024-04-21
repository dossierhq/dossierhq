import {
  EntityStatus,
  Schema,
  ErrorType,
  copyEntity,
  createRichText,
  createRichTextComponentNode,
  createRichTextHeadingNode,
  createRichTextTextNode,
  isEntityNameAsRequested,
  type RichTextComponentNode,
} from '@dossierhq/core';
import {
  assertEquals,
  assertErrorResult,
  assertOkResult,
  assertResultValue,
  assertSame,
  assertTruthy,
} from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  assertIsPublishedChangeValidations,
  assertIsPublishedComponents,
  assertIsPublishedLocationsComponent,
  assertIsPublishedRichTexts,
  assertIsPublishedStrings,
  assertIsPublishedTitleOnly,
  type LocationsComponent,
  type StringsFields,
  type TitleOnly,
  type AppPublishedUniqueIndexes,
} from '../SchemaTypes.js';
import {
  RICH_TEXTS_CREATE,
  STRINGS_CREATE,
  SUBJECT_ONLY_CREATE,
  TITLE_ONLY_CREATE,
  TITLE_ONLY_PUBLISHED_ENTITY,
  VALUE_ITEMS_CREATE,
  adminToPublishedEntity,
} from '../shared-entity/Fixtures.js';
import { createInvalidEntity } from '../shared-entity/InvalidEntityUtils.js';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite.js';

export const GetEntitySubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  getEntity_withSubjectAuthKey,
  getEntity_archivedThenPublished,
  getEntity_oldVersion,
  getEntity_entityAdminOnlyFieldIsExcluded,
  getEntity_componentAdminOnlyFieldIsExcluded,
  getEntity_componentAdminOnlyFieldInRichTextIsExcluded,
  getEntity_usingUniqueIndex,
  getEntity_invalidEntity,
  getEntity_invalidEntityAdminOnlyComponent,
  getEntity_invalidEntityAdminOnlyComponentList,
  getEntity_invalidEntityAdminOnlyComponentInRichText,
  getEntity_errorInvalidId,
  getEntity_errorInvalidUniqueIndexValue,
  getEntity_errorUniqueIndexValueFromAdminOnlyField,
  getEntity_errorWrongAuthKey,
  getEntity_errorWrongAuthKeyFromReadonlyRandom,
  getEntity_errorArchivedEntity,
];

async function getEntity_withSubjectAuthKey({ clientProvider }: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const adminSchema = new Schema((await adminClient.getSchemaSpecification()).valueOrThrow());

  const createResult = await adminClient.createEntity(SUBJECT_ONLY_CREATE, { publish: true });
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await publishedClient.getEntity({ id });
  assertResultValue(getResult, adminToPublishedEntity(adminSchema, createResult.value.entity));
}

async function getEntity_archivedThenPublished({ clientProvider }: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
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

  const getResult = await clientProvider.publishedClient().getEntity({ id });
  assertOkResult(getResult);
  assertIsPublishedTitleOnly(getResult.value);
  assertEquals(
    getResult.value,
    copyEntity(TITLE_ONLY_PUBLISHED_ENTITY, { id, info: { name, createdAt } }),
  );
}

async function getEntity_oldVersion({ clientProvider }: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const createResult = await adminClient.createEntity<TitleOnly>(
    copyEntity(TITLE_ONLY_CREATE, { info: { name: 'Original name' } }),
  );
  const {
    entity: {
      id,
      info: { createdAt },
      fields: { title },
    },
  } = createResult.valueOrThrow();

  const updateResult = await adminClient.updateEntity({
    id,
    info: { name: 'Updated name' },
    fields: { title: 'Updated title' },
  });
  assertOkResult(updateResult);

  const publishResult = await adminClient.publishEntities([{ id, version: 1 }]);
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

  const publishedEntity = (await clientProvider.publishedClient().getEntity({ id })).valueOrThrow();
  const publishedName = publishedEntity.info.name;
  assertTruthy(isEntityNameAsRequested(publishedName, 'Original name'));
  assertEquals(
    publishedEntity,
    copyEntity(TITLE_ONLY_PUBLISHED_ENTITY, {
      id,
      info: { name: publishedName, createdAt },
      fields: { title: title ?? '--no title--' },
    }),
  );
}

async function getEntity_entityAdminOnlyFieldIsExcluded({
  clientProvider,
}: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  const createResult = await adminClient.createEntity(
    copyEntity(STRINGS_CREATE, {
      fields: {
        multiline: 'multiline\nmultiline',
        stringAdminOnly: 'stringAdminOnly',
      },
    }),
    { publish: true },
  );
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const getResult = await publishedClient.getEntity({ id });
  const entity = getResult.valueOrThrow();
  assertIsPublishedStrings(entity);
  assertEquals(entity.fields, {
    multiline: 'multiline\nmultiline',
    pattern: null,
    patternList: null,
    values: null,
    valuesList: null,
    unique: null,
    uniqueGenericIndex: null,
  });
  assertEquals((entity.fields as StringsFields).stringAdminOnly, undefined);
}

async function getEntity_componentAdminOnlyFieldIsExcluded({
  clientProvider,
}: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  const adminLocationsComponent: LocationsComponent = {
    type: 'LocationsComponent',
    location: { lat: 12, lng: 34 },
    locationAdminOnly: { lat: 56, lng: 78 },
  };

  const createResult = await adminClient.createEntity(
    copyEntity(VALUE_ITEMS_CREATE, {
      fields: { any: adminLocationsComponent },
    }),
    { publish: true },
  );
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const getResult = await publishedClient.getEntity({ id });
  const entity = getResult.valueOrThrow();
  assertIsPublishedComponents(entity);
  const publishedLocationsComponent = entity.fields.any;
  assertTruthy(publishedLocationsComponent);
  assertIsPublishedLocationsComponent(publishedLocationsComponent);
  assertEquals(publishedLocationsComponent, {
    type: 'LocationsComponent',
    location: { lat: 12, lng: 34 },
  });
  assertEquals('locationAdminOnly' in publishedLocationsComponent, false);
}

async function getEntity_componentAdminOnlyFieldInRichTextIsExcluded({
  clientProvider,
}: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  const adminLocationsComponent: LocationsComponent = {
    type: 'LocationsComponent',
    location: { lat: 12, lng: 34 },
    locationAdminOnly: { lat: 56, lng: 78 },
  };

  const createResult = await adminClient.createEntity(
    copyEntity(RICH_TEXTS_CREATE, {
      fields: {
        richText: createRichText([createRichTextComponentNode(adminLocationsComponent)]),
      },
    }),
    { publish: true },
  );
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const getResult = await publishedClient.getEntity({ id });
  const entity = getResult.valueOrThrow();
  assertIsPublishedRichTexts(entity);

  const componentNode = entity.fields.richText?.root.children[0] as RichTextComponentNode;
  assertTruthy(componentNode);

  const publishedLocationsComponent = componentNode.data;
  assertIsPublishedLocationsComponent(publishedLocationsComponent);

  assertEquals(publishedLocationsComponent, {
    type: 'LocationsComponent',
    location: { lat: 12, lng: 34 },
  });
  assertEquals('locationAdminOnly' in publishedLocationsComponent, false);
}

async function getEntity_usingUniqueIndex({ clientProvider }: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const adminSchema = new Schema((await adminClient.getSchemaSpecification()).valueOrThrow());

  const unique = Math.random().toString();
  const createResult = await adminClient.createEntity(
    copyEntity(STRINGS_CREATE, { fields: { unique } }),
    { publish: true },
  );
  assertOkResult(createResult);

  const getResult = await clientProvider.publishedClient().getEntity({
    index: 'stringsUnique',
    value: unique,
  });
  assertOkResult(getResult);
  assertIsPublishedStrings(getResult.value);
  assertEquals(
    getResult.value,
    adminToPublishedEntity(
      adminSchema,
      copyEntity(createResult.value.entity, { info: { status: 'published' } }),
    ),
  );
}

async function getEntity_invalidEntity({ clientProvider }: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  const { entity } = (
    await createInvalidEntity(adminClient, { matchPattern: 'no match' }, { publish: true })
  ).valueOrThrow();

  const result = await publishedClient.getEntity({ id: entity.id });
  assertOkResult(result);
  assertSame(result.value.info.valid, false);
}

async function getEntity_invalidEntityAdminOnlyComponent({
  clientProvider,
}: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  const { entity } = (
    await createInvalidEntity(
      adminClient,
      { component: { type: 'AdminOnlyComponent' } },
      { publish: true },
    )
  ).valueOrThrow();

  const publishedEntity = (await publishedClient.getEntity({ id: entity.id })).valueOrThrow();
  assertIsPublishedChangeValidations(publishedEntity);
  assertSame(publishedEntity.info.valid, false);
  assertSame(publishedEntity.fields.component, null);
}

async function getEntity_invalidEntityAdminOnlyComponentList({
  clientProvider,
}: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  const { entity } = (
    await createInvalidEntity(
      adminClient,
      { componentList: [{ type: 'AdminOnlyComponent' }] },
      { publish: true },
    )
  ).valueOrThrow();

  const publishedEntity = (await publishedClient.getEntity({ id: entity.id })).valueOrThrow();
  assertIsPublishedChangeValidations(publishedEntity);
  assertSame(publishedEntity.info.valid, false);
  assertSame(publishedEntity.fields.componentList, null);
}

async function getEntity_invalidEntityAdminOnlyComponentInRichText({
  clientProvider,
}: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  const { entity } = (
    await createInvalidEntity(
      adminClient,
      {
        richText: createRichText([
          createRichTextComponentNode({ type: 'AdminOnlyComponent' }),
          createRichTextHeadingNode('h1', [createRichTextTextNode('After component')]),
        ]),
      },
      { publish: true },
    )
  ).valueOrThrow();

  const publishedEntity = (await publishedClient.getEntity({ id: entity.id })).valueOrThrow();
  assertIsPublishedChangeValidations(publishedEntity);
  assertSame(publishedEntity.info.valid, false);
  assertEquals(
    publishedEntity.fields.richText,
    createRichText([createRichTextHeadingNode('h1', [createRichTextTextNode('After component')])]),
  );
}

async function getEntity_errorInvalidId({ clientProvider }: PublishedEntityTestContext) {
  const publishedClient = clientProvider.publishedClient();
  const result = await publishedClient.getEntity({ id: '13e4c7da-616e-44a3-a039-24f96f9b17da' });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function getEntity_errorInvalidUniqueIndexValue({
  clientProvider,
}: PublishedEntityTestContext) {
  const publishedClient = clientProvider.publishedClient();
  const result = await publishedClient.getEntity({
    index: 'unknown-index' as AppPublishedUniqueIndexes,
    value: 'unknown-value',
  });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function getEntity_errorUniqueIndexValueFromAdminOnlyField({
  clientProvider,
}: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const unique = Math.random().toString();

  const createResult = await adminClient.createEntity(
    copyEntity(STRINGS_CREATE, {
      fields: { uniqueAdminOnly: unique },
    }),
    { publish: true },
  );
  assertOkResult(createResult);

  const result = await publishedClient.getEntity({ index: 'stringsUnique', value: unique });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function getEntity_errorWrongAuthKey({ clientProvider }: PublishedEntityTestContext) {
  const createResult = await clientProvider
    .adminClient()
    .createEntity(SUBJECT_ONLY_CREATE, { publish: true });

  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await clientProvider.publishedClient('secondary').getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
}

async function getEntity_errorWrongAuthKeyFromReadonlyRandom({
  clientProvider,
}: PublishedEntityTestContext) {
  const { entity } = (
    await clientProvider.adminClient().createEntity(SUBJECT_ONLY_CREATE, { publish: true })
  ).valueOrThrow();

  const getResult = await clientProvider
    .publishedClient('random', 'readonly')
    .getEntity({ id: entity.id });
  assertErrorResult(getResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
}

async function getEntity_errorArchivedEntity({ clientProvider }: PublishedEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

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
