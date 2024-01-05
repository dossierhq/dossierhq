import {
  AdminEntityStatus,
  ErrorType,
  EventType,
  copyEntity,
  createRichText,
  createRichTextComponentNode,
  createRichTextEntityLinkNode,
  createRichTextEntityNode,
  createRichTextParagraphNode,
  createRichTextTextNode,
} from '@dossierhq/core';
import { v4 as uuidv4 } from 'uuid';
import {
  assertEquals,
  assertErrorResult,
  assertNotSame,
  assertOkResult,
  assertResultValue,
  assertSame,
  assertTruthy,
} from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import {
  assertIsAdminLocations,
  assertIsAdminReferences,
  assertIsAdminRichTexts,
  assertIsAdminStrings,
  assertIsAdminSubjectOnly,
  assertIsAdminTitleOnly,
  type AdminLocations,
  type AdminReferences,
  type AdminReferencesComponent,
  type AdminRichTexts,
  type AdminStrings,
  type AdminSubjectOnly,
  type AdminTitleOnly,
} from '../SchemaTypes.js';
import { assertChangelogEventsConnection } from '../shared-entity/EventsTestUtils.js';
import {
  LOCATIONS_ADMIN_ENTITY,
  LOCATIONS_CREATE,
  REFERENCES_ADMIN_ENTITY,
  REFERENCES_CREATE,
  RICH_TEXTS_ADMIN_ENTITY,
  RICH_TEXTS_CREATE,
  STRINGS_ADMIN_ENTITY,
  STRINGS_CREATE,
  SUBJECT_ONLY_ADMIN_ENTITY,
  SUBJECT_ONLY_CREATE,
  TITLE_ONLY_ADMIN_ENTITY,
  TITLE_ONLY_CREATE,
  adminToPublishedEntity,
} from '../shared-entity/Fixtures.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const CreateEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  createEntity_minimal,
  createEntity_withId,
  createEntity_duplicateName,
  createEntity_canUsePublishedNameOfOtherEntity,
  createEntity_fiveInParallelWithSameName,
  createEntity_publishMinimal,
  createEntity_publishWithSubjectAuthKey,
  createEntity_publishWithUniqueIndexValue,
  createEntity_publishConflictingPublishedName,
  createEntity_createEntityEvent,
  createEntity_createAndPublishEntityEvent,
  createEntity_withAuthKeyMatchingPattern,
  createEntity_withMultilineField,
  createEntity_withMatchingPattern,
  createEntity_withMatchingValue,
  createEntity_withUniqueIndexValue,
  createEntity_withUniqueIndexValueSameValueInTwoIndexes,
  createEntity_withRichTextField,
  createEntity_withRichTextListField,
  createEntity_withRichTextFieldWithReference,
  createEntity_withRichTextFieldWithLinkReference,
  createEntity_withRichTextFieldWithComponent,
  createEntity_withTwoReferences,
  createEntity_withMultipleLocations,
  createEntity_errorAuthKeyNotMatchingPattern,
  createEntity_errorMultilineStringInTitle,
  createEntity_errorStringNotMatchingMatchPattern,
  createEntity_errorDuplicateUniqueIndexValue,
  createEntity_errorStringListNotMatchingMatchPattern,
  createEntity_errorStringListNotMatchingValues,
  createEntity_errorRichTextWithUnsupportedEntityNode,
  createEntity_errorRichTextWithUnsupportedLinkEntityType,
  createEntity_errorPublishWithoutRequiredTitle,
];

async function createEntity_minimal({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminTitleOnly>(TITLE_ONLY_CREATE);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.valueOrThrow();

  const expectedEntity = copyEntity(TITLE_ONLY_ADMIN_ENTITY, {
    id,
    info: {
      name,
      createdAt,
      updatedAt,
    },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminTitleOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withId({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const id = uuidv4();
  const createResult = await client.createEntity<AdminTitleOnly>(
    copyEntity(TITLE_ONLY_CREATE, { id }),
  );
  assertOkResult(createResult);
  const {
    entity: {
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(TITLE_ONLY_ADMIN_ENTITY, {
    id,
    info: {
      name,
      createdAt,
      updatedAt,
    },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminTitleOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_duplicateName({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const firstResult = await client.createEntity(TITLE_ONLY_CREATE);
  const secondResult = await client.createEntity(TITLE_ONLY_CREATE);

  const {
    entity: {
      id: firstId,
      info: { name: firstName },
    },
  } = firstResult.valueOrThrow();
  const {
    entity: {
      id: secondId,
      info: { name: secondName },
    },
  } = secondResult.valueOrThrow();
  assertNotSame(firstId, secondId);
  assertNotSame(firstName, secondName);

  assertTruthy(secondName.match(/^TitleOnly name#\d{8}$/));
}

async function createEntity_canUsePublishedNameOfOtherEntity({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();

  // Create/published first entity
  const {
    entity: {
      id: firstId,
      info: { name: firstName },
    },
  } = (await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true })).valueOrThrow();

  // Update name (without publishing), that way we only conflict on the published name
  assertOkResult(
    await adminClient.updateEntity({ id: firstId, info: { name: 'New name' }, fields: {} }),
  );

  // Create second entity with same name - should work since we're not publishing
  const {
    entity: {
      info: { name: secondName },
    },
  } = (
    await adminClient.createEntity(copyEntity(TITLE_ONLY_CREATE, { info: { name: firstName } }))
  ).valueOrThrow();

  assertSame(firstName, secondName);
}

async function createEntity_fiveInParallelWithSameName({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const results = await Promise.all(
    [1, 2, 3, 4, 5].map((num) =>
      client.createEntity(copyEntity(TITLE_ONLY_CREATE, { fields: { title: `Title ${num}` } })),
    ),
  );
  for (const result of results) {
    assertOkResult(result);
  }
}

async function createEntity_publishMinimal({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminTitleOnly>(TITLE_ONLY_CREATE, {
    publish: true,
  });
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.valueOrThrow();

  const expectedEntity = copyEntity(TITLE_ONLY_ADMIN_ENTITY, {
    id,
    info: {
      name,
      status: AdminEntityStatus.published,
      createdAt,
      updatedAt,
      validPublished: true,
    },
  });

  assertResultValue(createResult, {
    effect: 'createdAndPublished',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminTitleOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_publishWithSubjectAuthKey({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminTitleOnly>(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } }),
    { publish: true },
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(TITLE_ONLY_ADMIN_ENTITY, {
    id,
    info: {
      name,
      status: AdminEntityStatus.published,
      authKey: 'subject',
      createdAt,
      updatedAt,
      validPublished: true,
    },
  });

  assertResultValue(createResult, {
    effect: 'createdAndPublished',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminTitleOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_publishWithUniqueIndexValue({
  adminSchema,
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();
  const unique = Math.random().toString();
  const createResult = await adminClient.createEntity<AdminStrings>(
    copyEntity(STRINGS_CREATE, { fields: { unique } }),
    { publish: true },
  );
  assertOkResult(createResult);

  const getResult = await publishedClient.getEntity({ index: 'stringsUnique', value: unique });
  assertOkResult(getResult);
  assertEquals(getResult.value, adminToPublishedEntity(adminSchema, createResult.value.entity));
}

async function createEntity_publishConflictingPublishedName({
  clientProvider,
}: AdminEntityTestContext) {
  const adminClient = clientProvider.adminClient();
  const publishedClient = clientProvider.publishedClient();

  // Create/published first entity
  const {
    entity: {
      id: firstId,
      info: { name: firstName },
    },
  } = (await adminClient.createEntity(TITLE_ONLY_CREATE, { publish: true })).valueOrThrow();

  // Update name (without publishing), that way we only conflict on the published name
  assertOkResult(
    await adminClient.updateEntity({ id: firstId, info: { name: 'New name' }, fields: {} }),
  );

  // Create second entity with same name (should generate new name due to conflict)
  const {
    entity: {
      id: secondId,
      info: { name: secondName },
    },
  } = (
    await adminClient.createEntity(copyEntity(TITLE_ONLY_CREATE, { info: { name: firstName } }), {
      publish: true,
    })
  ).valueOrThrow();

  assertNotSame(firstName, secondName);

  // Get second published entity

  const {
    info: { name: secondPublishedName },
  } = (await publishedClient.getEntity({ id: secondId })).valueOrThrow();
  assertSame(secondPublishedName, secondName);
}

async function createEntity_createEntityEvent({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminTitleOnly>(TITLE_ONLY_CREATE);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt, version },
    },
  } = createResult.valueOrThrow();

  assertEquals(createdAt, updatedAt);

  const connectionResult = await client.getChangelogEvents({ entity: { id } });
  assertChangelogEventsConnection(connectionResult, [
    {
      type: EventType.createEntity,
      createdAt,
      createdBy: '',
      entities: [{ id, name, version, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
  ]);
}

async function createEntity_createAndPublishEntityEvent({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminTitleOnly>(TITLE_ONLY_CREATE, {
    publish: true,
  });
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt, version },
    },
  } = createResult.valueOrThrow();

  assertEquals(createdAt, updatedAt);

  const connectionResult = await client.getChangelogEvents({ entity: { id } });
  assertChangelogEventsConnection(connectionResult, [
    {
      type: EventType.createAndPublishEntity,
      createdAt,
      createdBy: '',
      entities: [{ id, name, version, type: 'TitleOnly' }],
      unauthorizedEntityCount: 0,
    },
  ]);
}

async function createEntity_withAuthKeyMatchingPattern({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminSubjectOnly>(SUBJECT_ONLY_CREATE);
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(SUBJECT_ONLY_ADMIN_ENTITY, {
    id,
    info: {
      name,
      createdAt,
      updatedAt,
    },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminSubjectOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withMultilineField({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminStrings>(
    copyEntity(STRINGS_CREATE, { fields: { multiline: 'one\ntwo\nthree' } }),
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(STRINGS_ADMIN_ENTITY, {
    id,
    info: { name, createdAt, updatedAt },
    fields: { multiline: 'one\ntwo\nthree' },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminStrings(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withMatchingPattern({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminStrings>(
    copyEntity(STRINGS_CREATE, { fields: { pattern: 'foo', patternList: ['foo', 'bar', 'baz'] } }),
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(STRINGS_ADMIN_ENTITY, {
    id,
    info: { name, createdAt, updatedAt },
    fields: { pattern: 'foo', patternList: ['foo', 'bar', 'baz'] },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminStrings(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withMatchingValue({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminStrings>(
    copyEntity(STRINGS_CREATE, { fields: { values: 'foo', valuesList: ['foo', 'bar', 'baz'] } }),
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(STRINGS_ADMIN_ENTITY, {
    id,
    info: { name, createdAt, updatedAt },
    fields: { values: 'foo', valuesList: ['foo', 'bar', 'baz'] },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminStrings(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withUniqueIndexValue({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const unique = Math.random().toString();
  const createResult = await client.createEntity<AdminStrings>(
    copyEntity(STRINGS_CREATE, { fields: { unique } }),
  );
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.valueOrThrow();

  const expectedEntity = copyEntity(STRINGS_ADMIN_ENTITY, {
    id,
    info: { name, createdAt, updatedAt },
    fields: { unique },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminStrings(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withUniqueIndexValueSameValueInTwoIndexes({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const unique = Math.random().toString();

  (
    await client.createEntity<AdminStrings>(
      copyEntity(STRINGS_CREATE, { fields: { uniqueGenericIndex: unique } }),
    )
  ).throwIfError();

  // This would fail unless there weren't two separate indexes
  const secondCreateResult = await client.createEntity<AdminStrings>(
    copyEntity(STRINGS_CREATE, { fields: { unique } }),
  );
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = secondCreateResult.valueOrThrow();

  const expectedEntity = copyEntity(STRINGS_ADMIN_ENTITY, {
    id,
    info: { name, createdAt, updatedAt },
    fields: { unique },
  });

  assertResultValue(secondCreateResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminStrings(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withRichTextField({ clientProvider }: AdminEntityTestContext) {
  const richText = createRichText([
    createRichTextParagraphNode([createRichTextTextNode('Hello world')]),
  ]);
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminRichTexts>(
    copyEntity(RICH_TEXTS_CREATE, { fields: { richText } }),
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(RICH_TEXTS_ADMIN_ENTITY, {
    id,
    info: { name, createdAt, updatedAt },
    fields: { richText },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminRichTexts(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withRichTextListField({ clientProvider }: AdminEntityTestContext) {
  const richText1 = createRichText([
    createRichTextParagraphNode([createRichTextTextNode('Hello world 1')]),
  ]);
  const richText2 = createRichText([
    createRichTextParagraphNode([createRichTextTextNode('Hello world 2')]),
  ]);
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminRichTexts>(
    copyEntity(RICH_TEXTS_CREATE, { fields: { richTextList: [richText1, richText2] } }),
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(RICH_TEXTS_ADMIN_ENTITY, {
    id,
    info: { name, createdAt, updatedAt },
    fields: { richTextList: [richText1, richText2] },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminRichTexts(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withRichTextFieldWithReference({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();

  const createTitleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createTitleOnlyResult);

  const richText = createRichText([
    createRichTextParagraphNode([
      createRichTextEntityNode({ id: createTitleOnlyResult.value.entity.id }),
    ]),
  ]);
  const createResult = await client.createEntity<AdminRichTexts>(
    copyEntity(RICH_TEXTS_CREATE, { fields: { richText } }),
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(RICH_TEXTS_ADMIN_ENTITY, {
    id,
    info: { name, createdAt, updatedAt },
    fields: { richText },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminRichTexts(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withRichTextFieldWithLinkReference({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();

  const createTitleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createTitleOnlyResult);

  const richText = createRichText([
    createRichTextParagraphNode([
      createRichTextEntityLinkNode({ id: createTitleOnlyResult.value.entity.id }, [
        createRichTextTextNode('Hello world'),
      ]),
    ]),
  ]);
  const createResult = await client.createEntity<AdminRichTexts>(
    copyEntity(RICH_TEXTS_CREATE, { fields: { richText } }),
  );
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.valueOrThrow();

  const expectedEntity = copyEntity(RICH_TEXTS_ADMIN_ENTITY, {
    id,
    info: { name, createdAt, updatedAt },
    fields: { richText },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminRichTexts(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withRichTextFieldWithComponent({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();

  const createTitleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createTitleOnlyResult);

  const richText = createRichText([
    createRichTextParagraphNode([
      createRichTextComponentNode<AdminReferencesComponent>({
        type: 'ReferencesComponent',
        reference: { id: createTitleOnlyResult.value.entity.id },
      }),
    ]),
  ]);
  const createResult = await client.createEntity<AdminRichTexts>(
    copyEntity(RICH_TEXTS_CREATE, { fields: { richText } }),
  );
  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(RICH_TEXTS_ADMIN_ENTITY, {
    id,
    info: { name, createdAt, updatedAt },
    fields: { richText },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminRichTexts(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withTwoReferences({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createTitleOnly1Result = await client.createEntity(TITLE_ONLY_CREATE);
  const createTitleOnly2Result = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createTitleOnly1Result);
  assertOkResult(createTitleOnly2Result);
  const {
    entity: { id: idTitleOnly1 },
  } = createTitleOnly1Result.value;
  const {
    entity: { id: idTitleOnly2 },
  } = createTitleOnly2Result.value;

  const createResult = await client.createEntity<AdminReferences>(
    copyEntity(REFERENCES_CREATE, {
      fields: { any: { id: idTitleOnly1 }, titleOnly: { id: idTitleOnly2 } },
    }),
  );

  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(REFERENCES_ADMIN_ENTITY, {
    id,
    info: {
      name,
      createdAt,
      updatedAt,
    },
    fields: {
      any: { id: idTitleOnly1 },
      titleOnly: { id: idTitleOnly2 },
    },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminReferences(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withMultipleLocations({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const createResult = await client.createEntity<AdminLocations>(
    copyEntity(LOCATIONS_CREATE, {
      fields: {
        location: { lat: 1, lng: 2 },
        locationList: [
          { lat: 3, lng: 4 },
          { lat: -179, lng: -178 },
        ],
      },
    }),
  );

  assertOkResult(createResult);
  const {
    entity: {
      id,
      info: { name, createdAt, updatedAt },
    },
  } = createResult.value;

  const expectedEntity = copyEntity(LOCATIONS_ADMIN_ENTITY, {
    id,
    info: {
      name,
      createdAt,
      updatedAt,
    },
    fields: {
      location: { lat: 1, lng: 2 },
      locationList: [
        { lat: 3, lng: 4 },
        { lat: -179, lng: -178 },
      ],
    },
  });

  assertResultValue(createResult, {
    effect: 'created',
    entity: expectedEntity,
  });

  const getResult = await client.getEntity({ id });
  assertOkResult(getResult);
  assertIsAdminLocations(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_errorAuthKeyNotMatchingPattern({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const id = uuidv4();
  const createResult = await client.createEntity(
    copyEntity(SUBJECT_ONLY_CREATE, { id, info: { authKey: 'none' } }),
  );
  assertErrorResult(
    createResult,
    ErrorType.BadRequest,
    "info.authKey: AuthKey 'none' does not match pattern 'subject' (^subject$)",
  );

  const getResult = await client.getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotFound, 'No such entity');
}

async function createEntity_errorMultilineStringInTitle({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const id = uuidv4();
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { id, fields: { title: 'Hello\nWorld\n' } }),
  );
  assertErrorResult(
    createResult,
    ErrorType.BadRequest,
    'entity.fields.title: Value cannot contain line breaks',
  );

  const getResult = await client.getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotFound, 'No such entity');
}

async function createEntity_errorStringNotMatchingMatchPattern({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const id = uuidv4();
  const createResult = await client.createEntity(
    copyEntity(STRINGS_CREATE, { id, fields: { pattern: 'not matching' } }),
  );
  assertErrorResult(
    createResult,
    ErrorType.BadRequest,
    'entity.fields.pattern: Value does not match pattern fooBarBaz',
  );
}

async function createEntity_errorDuplicateUniqueIndexValue({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const unique = Math.random().toString();

  const firstResult = await client.createEntity(copyEntity(STRINGS_CREATE, { fields: { unique } }));
  assertOkResult(firstResult);

  const secondResult = await client.createEntity(
    copyEntity(STRINGS_CREATE, { fields: { unique } }),
  );
  assertErrorResult(
    secondResult,
    ErrorType.BadRequest,
    `entity.fields.unique: Value is not unique (stringsUnique:${unique})`,
  );
}

async function createEntity_errorStringListNotMatchingMatchPattern({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const id = uuidv4();
  const createResult = await client.createEntity(
    copyEntity(STRINGS_CREATE, { id, fields: { patternList: ['foo', 'not matching'] } }),
  );
  assertErrorResult(
    createResult,
    ErrorType.BadRequest,
    'entity.fields.patternList[1]: Value does not match pattern fooBarBaz',
  );
}

async function createEntity_errorStringListNotMatchingValues({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const id = uuidv4();
  const createResult = await client.createEntity(
    copyEntity(STRINGS_CREATE, { id, fields: { valuesList: ['foo', 'not matching' as 'bar'] } }),
  );
  assertErrorResult(
    createResult,
    ErrorType.BadRequest,
    'entity.fields.valuesList[1]: Value does not match any of the allowed values',
  );
}

async function createEntity_errorRichTextWithUnsupportedEntityNode({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const id = uuidv4();
  const referenceId = uuidv4();
  const createResult = await client.createEntity(
    copyEntity(RICH_TEXTS_CREATE, {
      id,
      fields: {
        richTextMinimal: createRichText([createRichTextEntityNode({ id: referenceId })]),
      },
    }),
  );
  assertErrorResult(
    createResult,
    ErrorType.BadRequest,
    `entity.fields.richTextMinimal[0]: Rich text node type entity is not allowed in field (supported nodes: linebreak, paragraph, root, tab, text)`,
  );

  const getResult = await client.getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotFound, 'No such entity');
}

async function createEntity_errorRichTextWithUnsupportedLinkEntityType({
  clientProvider,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const referenceId = readOnlyEntityRepository.getMainPrincipalAdminEntities()[0].id;
  const id = uuidv4();
  const createResult = await client.createEntity(
    copyEntity(RICH_TEXTS_CREATE, {
      id,
      fields: {
        richTextLimitedTypes: createRichText([
          createRichTextEntityLinkNode({ id: referenceId }, [createRichTextTextNode('link text')]),
        ]),
      },
    }),
  );
  assertErrorResult(
    createResult,
    ErrorType.BadRequest,
    `entity.fields.richTextLimitedTypes[0]: Linked entity (${referenceId}) has an invalid type ReadOnly`,
  );

  const getResult = await client.getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotFound, 'No such entity');
}

async function createEntity_errorPublishWithoutRequiredTitle({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.adminClient();
  const id = uuidv4();
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { id, fields: { title: null } }),
    { publish: true },
  );
  assertErrorResult(
    createResult,
    ErrorType.BadRequest,
    `entity(${id}).fields.title: Required field is empty`,
  );

  const getResult = await client.getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotFound, 'No such entity');
}
