import type { RichTextValueItemNode } from '@dossierhq/core';
import {
  AdminEntityStatus,
  assertIsDefined,
  copyEntity,
  createRichTextRootNode,
  createRichTextValueItemNode,
  ErrorType,
} from '@dossierhq/core';
import {
  assertEquals,
  assertErrorResult,
  assertOkResult,
  assertResultValue,
  assertSame,
} from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type {
  AdminLocationsValue,
  AdminStringsFields,
  AdminTitleOnly,
  AppPublishedUniqueIndexes,
} from '../SchemaTypes.js';
import {
  assertIsPublishedLocationsValue,
  assertIsPublishedRichTexts,
  assertIsPublishedStrings,
  assertIsPublishedTitleOnly,
  assertIsPublishedValueItems,
} from '../SchemaTypes.js';
import {
  adminToPublishedEntity,
  RICH_TEXTS_CREATE,
  STRINGS_CREATE,
  TITLE_ONLY_CREATE,
  TITLE_ONLY_PUBLISHED_ENTITY,
  VALUE_ITEMS_CREATE,
} from '../shared-entity/Fixtures.js';
import { createInvalidEntity } from '../shared-entity/InvalidEntityUtils.js';
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
  getEntity_entityAdminOnlyFieldIsExcluded,
  getEntity_valueItemAdminOnlyFieldIsExcluded,
  getEntity_valueItemAdminOnlyFieldInRichTextIsExcluded,
  getEntity_usingUniqueIndex,
  getEntity_invalidEntity,
  getEntity_errorInvalidId,
  getEntity_errorInvalidUniqueIndexValue,
  getEntity_errorUniqueIndexValueFromAdminOnlyField,
  getEntity_errorWrongAuthKey,
  getEntity_errorArchivedEntity,
];

async function getEntity_withSubjectAuthKey({ adminSchema, server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);
  const createResult = await adminClient.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } }),
    { publish: true }
  );
  assertOkResult(createResult);
  const {
    entity: { id },
  } = createResult.value;

  const getResult = await publishedClient.getEntity({ id });
  assertResultValue(getResult, adminToPublishedEntity(adminSchema, createResult.value.entity));
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
  assertOkResult(getResult);
  assertIsPublishedTitleOnly(getResult.value);
  assertEquals(
    getResult.value,
    copyEntity(TITLE_ONLY_PUBLISHED_ENTITY, { id, info: { name, createdAt } })
  );
}

async function getEntity_oldVersion({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const createResult = await adminClient.createEntity<AdminTitleOnly>(TITLE_ONLY_CREATE);
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
  assertOkResult(getResult);
  assertIsPublishedTitleOnly(getResult.value);
  assertEquals(
    getResult.value,
    copyEntity(TITLE_ONLY_PUBLISHED_ENTITY, {
      id,
      info: { name, createdAt },
      fields: { title: createResult.value.entity.fields.title ?? '--no title--' },
    })
  );
}

async function getEntity_entityAdminOnlyFieldIsExcluded({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const createResult = await adminClient.createEntity(
    copyEntity(STRINGS_CREATE, {
      fields: {
        multiline: 'multiline\nmultiline',
        stringAdminOnly: 'stringAdminOnly',
      },
    }),
    { publish: true }
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
  assertEquals((entity.fields as AdminStringsFields).stringAdminOnly, undefined);
}

async function getEntity_valueItemAdminOnlyFieldIsExcluded({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const adminLocationsValueItem: AdminLocationsValue = {
    type: 'LocationsValue',
    location: { lat: 12, lng: 34 },
    locationAdminOnly: { lat: 56, lng: 78 },
  };

  const createResult = await adminClient.createEntity(
    copyEntity(VALUE_ITEMS_CREATE, {
      fields: { any: adminLocationsValueItem },
    }),
    { publish: true }
  );
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const getResult = await publishedClient.getEntity({ id });
  const entity = getResult.valueOrThrow();
  assertIsPublishedValueItems(entity);
  const publishedLocationsValueItem = entity.fields.any;
  assertIsDefined(publishedLocationsValueItem);
  assertIsPublishedLocationsValue(publishedLocationsValueItem);
  assertEquals(publishedLocationsValueItem, {
    type: 'LocationsValue',
    location: { lat: 12, lng: 34 },
  });
  assertEquals('locationAdminOnly' in publishedLocationsValueItem, false);
}

async function getEntity_valueItemAdminOnlyFieldInRichTextIsExcluded({
  server,
}: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const adminLocationsValueItem: AdminLocationsValue = {
    type: 'LocationsValue',
    location: { lat: 12, lng: 34 },
    locationAdminOnly: { lat: 56, lng: 78 },
  };

  const createResult = await adminClient.createEntity(
    copyEntity(RICH_TEXTS_CREATE, {
      fields: {
        richText: createRichTextRootNode([createRichTextValueItemNode(adminLocationsValueItem)]),
      },
    }),
    { publish: true }
  );
  const {
    entity: { id },
  } = createResult.valueOrThrow();

  const getResult = await publishedClient.getEntity({ id });
  const entity = getResult.valueOrThrow();
  assertIsPublishedRichTexts(entity);

  const valueItemNode = entity.fields.richText?.root.children[0] as RichTextValueItemNode;
  assertIsDefined(valueItemNode);

  const publishedLocationsValueItem = valueItemNode.data;
  assertIsPublishedLocationsValue(publishedLocationsValueItem);

  assertEquals(publishedLocationsValueItem, {
    type: 'LocationsValue',
    location: { lat: 12, lng: 34 },
  });
  assertEquals('locationAdminOnly' in publishedLocationsValueItem, false);
}

async function getEntity_usingUniqueIndex({ adminSchema, server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const unique = Math.random().toString();
  const createResult = await adminClient.createEntity(
    copyEntity(STRINGS_CREATE, { fields: { unique } }),
    { publish: true }
  );
  assertOkResult(createResult);

  const getResult = await publishedClientForMainPrincipal(server).getEntity({
    index: 'stringsUnique',
    value: unique,
  });
  assertOkResult(getResult);
  assertIsPublishedStrings(getResult.value);
  assertEquals(
    getResult.value,
    adminToPublishedEntity(
      adminSchema,
      copyEntity(createResult.value.entity, { info: { status: 'published' } })
    )
  );
}

async function getEntity_invalidEntity({ server }: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);

  const { entity } = (
    await createInvalidEntity(server, adminClient, { matchPattern: 'no match' }, { publish: true })
  ).valueOrThrow();

  const result = await publishedClient.getEntity({ id: entity.id });
  assertOkResult(result);
  assertSame(result.value.info.valid, false);
}

async function getEntity_errorInvalidId({ server }: PublishedEntityTestContext) {
  const publishedClient = publishedClientForMainPrincipal(server);
  const result = await publishedClient.getEntity({ id: '13e4c7da-616e-44a3-a039-24f96f9b17da' });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function getEntity_errorInvalidUniqueIndexValue({ server }: PublishedEntityTestContext) {
  const publishedClient = publishedClientForMainPrincipal(server);
  const result = await publishedClient.getEntity({
    index: 'unknown-index' as AppPublishedUniqueIndexes,
    value: 'unknown-value',
  });
  assertErrorResult(result, ErrorType.NotFound, 'No such entity');
}

async function getEntity_errorUniqueIndexValueFromAdminOnlyField({
  server,
}: PublishedEntityTestContext) {
  const adminClient = adminClientForMainPrincipal(server);
  const publishedClient = publishedClientForMainPrincipal(server);
  const unique = Math.random().toString();

  const createResult = await adminClient.createEntity(
    copyEntity(STRINGS_CREATE, {
      fields: { uniqueAdminOnly: unique },
    }),
    { publish: true }
  );
  assertOkResult(createResult);

  const result = await publishedClient.getEntity({ index: 'stringsUnique', value: unique });
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
