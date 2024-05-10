import {
  copyEntity,
  createRichText,
  createRichTextComponentNode,
  createRichTextEntityLinkNode,
  createRichTextEntityNode,
  createRichTextParagraphNode,
  createRichTextTextNode,
  EntityStatus,
  ErrorType,
  EventType,
  isEntityNameAsRequested,
  Schema,
} from '@dossierhq/core';
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
  assertIsLocations,
  assertIsReferences,
  assertIsRichTexts,
  assertIsStrings,
  assertIsSubjectOnly,
  assertIsTitleOnly,
  type Locations,
  type References,
  type ReferencesComponent,
  type RichTexts,
  type Strings,
  type SubjectOnly,
  type TitleOnly,
} from '../SchemaTypes.js';
import { assertChangelogEventsConnection } from '../shared-entity/EventsTestUtils.js';
import {
  adminToPublishedEntity,
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
  SUBJECT_OR_DEFAULT_CREATE,
  TITLE_ONLY_ADMIN_ENTITY,
  TITLE_ONLY_CREATE,
} from '../shared-entity/Fixtures.js';
import type { AdminEntityTestContext } from './AdminEntityTestSuite.js';

export const CreateEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  createEntity_minimal,
  createEntity_withId,
  createEntity_withIdTwice,
  createEntity_withIdTwicePublished,
  createEntity_withIdTwiceNormalizeFields,
  createEntity_duplicateName,
  createEntity_canUsePublishedNameOfOtherEntity,
  createEntity_fiveInParallelWithSameName,
  createEntity_noNameUsingTitleField,
  createEntity_noNameUsingTypeName,
  createEntity_noAuthKeyUndefined,
  createEntity_noAuthKeyNull,
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
  createEntity_errorConflictAttemptingToCreateUpdatedEntity,
  createEntity_errorConflictAttemptingToCreateDifferentSubjects,
  createEntity_errorConflictAttemptingToCreateDifferentType,
  createEntity_errorConflictAttemptingToCreateDifferentAuthKey,
  createEntity_errorConflictAttemptingToCreateDifferentName,
  createEntity_errorConflictAttemptingToCreateDifferentStatus,
  createEntity_errorConflictAttemptingToCreateDifferentFields,
  createEntity_errorAuthKeyNotMatchingPattern,
  createEntity_errorMultilineStringInTitle,
  createEntity_errorStringNotMatchingMatchPattern,
  createEntity_errorDuplicateUniqueIndexValue,
  createEntity_errorStringListNotMatchingMatchPattern,
  createEntity_errorStringListNotMatchingValues,
  createEntity_errorRichTextWithUnsupportedEntityNode,
  createEntity_errorRichTextWithUnsupportedLinkEntityType,
  createEntity_errorPublishWithoutRequiredTitle,
  createEntity_errorReadonlySession,
];

async function createEntity_minimal({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<TitleOnly>(TITLE_ONLY_CREATE);
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
  assertIsTitleOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withId({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
  const createResult = await client.createEntity<TitleOnly>(copyEntity(TITLE_ONLY_CREATE, { id }));
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
  assertIsTitleOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withIdTwice({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
  const entityCreate = copyEntity(TITLE_ONLY_CREATE, { id });
  const firstResult = await client.createEntity<TitleOnly>(entityCreate);
  assertOkResult(firstResult);

  const secondResult = await client.createEntity<TitleOnly>(entityCreate);
  assertOkResult(secondResult);

  assertResultValue(secondResult, {
    effect: 'none',
    entity: firstResult.value.entity,
  });

  assertEquals(firstResult.value.entity, secondResult.value.entity);
}

async function createEntity_withIdTwicePublished({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
  const entityCreate = copyEntity(TITLE_ONLY_CREATE, { id });
  const firstResult = await client.createEntity<TitleOnly>(entityCreate, { publish: true });
  assertOkResult(firstResult);

  const secondResult = await client.createEntity<TitleOnly>(entityCreate, { publish: true });
  assertOkResult(secondResult);

  assertResultValue(secondResult, {
    effect: 'none',
    entity: firstResult.value.entity,
  });

  assertEquals(firstResult.value.entity, secondResult.value.entity);
}

async function createEntity_withIdTwiceNormalizeFields({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
  const entityCreate = copyEntity(STRINGS_CREATE, { id });
  const firstResult = await client.createEntity(
    copyEntity(entityCreate, { fields: { valuesList: null } }),
  );
  assertOkResult(firstResult);

  // since empty list is normalized to null we check that the quality check on fields are done on normalized values
  const secondResult = await client.createEntity(
    copyEntity(entityCreate, { fields: { valuesList: [] } }),
  );
  assertOkResult(secondResult);
  assertSame(secondResult.value.entity.fields.valuesList, null);

  assertResultValue(secondResult, {
    effect: 'none',
    entity: firstResult.value.entity,
  });

  assertEquals(firstResult.value.entity, secondResult.value.entity);
}

async function createEntity_duplicateName({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
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
  const client = clientProvider.dossierClient();

  // Create/published first entity
  const {
    entity: {
      id: firstId,
      info: { name: firstName },
    },
  } = (await client.createEntity(TITLE_ONLY_CREATE, { publish: true })).valueOrThrow();

  // Update name (without publishing), that way we only conflict on the published name
  assertOkResult(
    await client.updateEntity({ id: firstId, info: { name: 'New name' }, fields: {} }),
  );

  // Create second entity with same name - should work since we're not publishing
  const {
    entity: {
      info: { name: secondName },
    },
  } = (
    await client.createEntity(copyEntity(TITLE_ONLY_CREATE, { info: { name: firstName } }))
  ).valueOrThrow();

  assertSame(firstName, secondName);
}

async function createEntity_fiveInParallelWithSameName({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const results = await Promise.all(
    [1, 2, 3, 4, 5].map((num) =>
      client.createEntity(copyEntity(TITLE_ONLY_CREATE, { fields: { title: `Title ${num}` } })),
    ),
  );
  for (const result of results) {
    assertOkResult(result);
  }
}

async function createEntity_noNameUsingTitleField({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<TitleOnly>({
    info: { type: 'TitleOnly' },
    fields: { title: 'The name set by title field' },
  });
  const {
    entity: {
      info: { name },
    },
  } = createResult.valueOrThrow();

  assertTruthy(isEntityNameAsRequested(name, 'The name set by title field'));
}

async function createEntity_noNameUsingTypeName({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<Strings>({
    info: { type: 'Strings' },
    fields: {},
  });
  const {
    entity: {
      info: { name },
    },
  } = createResult.valueOrThrow();

  assertTruthy(isEntityNameAsRequested(name, 'Strings'));
}

async function createEntity_noAuthKeyUndefined({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<TitleOnly>(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: undefined } }),
  );
  const {
    entity: {
      info: { authKey },
    },
  } = createResult.valueOrThrow();

  assertEquals(authKey, '');
}

async function createEntity_noAuthKeyNull({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<TitleOnly>(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: null } }),
  );
  const {
    entity: {
      info: { authKey },
    },
  } = createResult.valueOrThrow();

  assertEquals(authKey, '');
}

async function createEntity_publishMinimal({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<TitleOnly>(TITLE_ONLY_CREATE, {
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
      status: EntityStatus.published,
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
  assertIsTitleOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_publishWithSubjectAuthKey({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity(SUBJECT_ONLY_CREATE, {
    publish: true,
  });
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
      status: EntityStatus.published,
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
  assertIsSubjectOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_publishWithUniqueIndexValue({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const publishedClient = clientProvider.publishedClient();
  const schema = new Schema((await client.getSchemaSpecification()).valueOrThrow());

  const unique = Math.random().toString();
  const createResult = await client.createEntity<Strings>(
    copyEntity(STRINGS_CREATE, { fields: { unique } }),
    { publish: true },
  );
  assertOkResult(createResult);

  const getResult = await publishedClient.getEntity({ index: 'stringsUnique', value: unique });
  assertOkResult(getResult);
  assertEquals(getResult.value, adminToPublishedEntity(schema, createResult.value.entity));
}

async function createEntity_publishConflictingPublishedName({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const publishedClient = clientProvider.publishedClient();

  // Create/published first entity
  const {
    entity: {
      id: firstId,
      info: { name: firstName },
    },
  } = (await client.createEntity(TITLE_ONLY_CREATE, { publish: true })).valueOrThrow();

  // Update name (without publishing), that way we only conflict on the published name
  assertOkResult(
    await client.updateEntity({ id: firstId, info: { name: 'New name' }, fields: {} }),
  );

  // Create second entity with same name (should generate new name due to conflict)
  const {
    entity: {
      id: secondId,
      info: { name: secondName },
    },
  } = (
    await client.createEntity(copyEntity(TITLE_ONLY_CREATE, { info: { name: firstName } }), {
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
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<TitleOnly>(TITLE_ONLY_CREATE);
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
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<TitleOnly>(TITLE_ONLY_CREATE, {
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
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<SubjectOnly>(SUBJECT_ONLY_CREATE);
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
  assertIsSubjectOnly(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withMultilineField({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<Strings>(
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
  assertIsStrings(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withMatchingPattern({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<Strings>(
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
  assertIsStrings(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withMatchingValue({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<Strings>(
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
  assertIsStrings(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withUniqueIndexValue({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const unique = Math.random().toString();
  const createResult = await client.createEntity<Strings>(
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
  assertIsStrings(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withUniqueIndexValueSameValueInTwoIndexes({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const unique = Math.random().toString();

  (
    await client.createEntity<Strings>(
      copyEntity(STRINGS_CREATE, { fields: { uniqueGenericIndex: unique } }),
    )
  ).throwIfError();

  // This would fail unless there weren't two separate indexes
  const secondCreateResult = await client.createEntity<Strings>(
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
  assertIsStrings(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withRichTextField({ clientProvider }: AdminEntityTestContext) {
  const richText = createRichText([
    createRichTextParagraphNode([createRichTextTextNode('Hello world')]),
  ]);
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<RichTexts>(
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
  assertIsRichTexts(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withRichTextListField({ clientProvider }: AdminEntityTestContext) {
  const richText1 = createRichText([
    createRichTextParagraphNode([createRichTextTextNode('Hello world 1')]),
  ]);
  const richText2 = createRichText([
    createRichTextParagraphNode([createRichTextTextNode('Hello world 2')]),
  ]);
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<RichTexts>(
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
  assertIsRichTexts(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withRichTextFieldWithReference({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const createTitleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createTitleOnlyResult);

  const richText = createRichText([
    createRichTextParagraphNode([
      createRichTextEntityNode({ id: createTitleOnlyResult.value.entity.id }),
    ]),
  ]);
  const createResult = await client.createEntity<RichTexts>(
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
  assertIsRichTexts(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withRichTextFieldWithLinkReference({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const createTitleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createTitleOnlyResult);

  const richText = createRichText([
    createRichTextParagraphNode([
      createRichTextEntityLinkNode({ id: createTitleOnlyResult.value.entity.id }, [
        createRichTextTextNode('Hello world'),
      ]),
    ]),
  ]);
  const createResult = await client.createEntity<RichTexts>(
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
  assertIsRichTexts(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withRichTextFieldWithComponent({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();

  const createTitleOnlyResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertOkResult(createTitleOnlyResult);

  const richText = createRichText([
    createRichTextParagraphNode([
      createRichTextComponentNode<ReferencesComponent>({
        type: 'ReferencesComponent',
        reference: { id: createTitleOnlyResult.value.entity.id },
      }),
    ]),
  ]);
  const createResult = await client.createEntity<RichTexts>(
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
  assertIsRichTexts(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withTwoReferences({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
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

  const createResult = await client.createEntity<References>(
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
  assertIsReferences(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_withMultipleLocations({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const createResult = await client.createEntity<Locations>(
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
  assertIsLocations(getResult.value);
  assertEquals(getResult.value, expectedEntity);
}

async function createEntity_errorConflictAttemptingToCreateUpdatedEntity({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();

  // Create and update entity (so its version becomes 2)
  const firstCreateResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { id, fields: { title: 'Original title' } }),
  );
  assertOkResult(firstCreateResult);

  assertOkResult(await client.updateEntity({ id, fields: { title: 'Updated title' } }));

  // Attempt to create entity with same ID
  const secondCreateResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { id, fields: { title: 'Updated title' } }),
  );
  assertErrorResult(
    secondCreateResult,
    ErrorType.Conflict,
    `Entity with id (${id}) already exists`,
  );
}

async function createEntity_errorConflictAttemptingToCreateDifferentSubjects({
  clientProvider,
}: AdminEntityTestContext) {
  const mainClient = clientProvider.dossierClient();
  const secondaryClient = clientProvider.dossierClient('secondary');
  const id = crypto.randomUUID();

  const entityCreate = copyEntity(TITLE_ONLY_CREATE, { id });

  assertOkResult(await mainClient.createEntity(entityCreate));

  const secondCreateResult = await secondaryClient.createEntity(entityCreate);

  assertErrorResult(
    secondCreateResult,
    ErrorType.Conflict,
    `Entity with id (${id}) already exists`,
  );
}

async function createEntity_errorConflictAttemptingToCreateDifferentType({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();

  assertOkResult(
    await client.createEntity({
      id,
      info: { name: 'Entity name', type: 'SubjectOnly', authKey: 'subject' },
      fields: {},
    }),
  );

  const secondCreateResult = await client.createEntity({
    id,
    info: { name: 'Entity name', type: 'SubjectOrDefaultAuthKey', authKey: 'subject' },
    fields: {},
  });

  assertErrorResult(
    secondCreateResult,
    ErrorType.Conflict,
    `Entity with id (${id}) already exists`,
  );
}

async function createEntity_errorConflictAttemptingToCreateDifferentAuthKey({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();

  const entityCreate = copyEntity(SUBJECT_OR_DEFAULT_CREATE, { id, info: { authKey: 'subject' } });

  assertOkResult(await client.createEntity(entityCreate));

  const secondCreateResult = await client.createEntity(
    copyEntity(entityCreate, { info: { authKey: '' } }),
  );
  assertErrorResult(
    secondCreateResult,
    ErrorType.Conflict,
    `Entity with id (${id}) already exists`,
  );
}

async function createEntity_errorConflictAttemptingToCreateDifferentName({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();

  const entityCreate = copyEntity(TITLE_ONLY_CREATE, { id, info: { name: 'First name' } });

  assertOkResult(await client.createEntity(entityCreate));

  const secondCreateResult = await client.createEntity(
    copyEntity(entityCreate, { info: { name: 'Another name' } }),
  );
  assertErrorResult(
    secondCreateResult,
    ErrorType.Conflict,
    `Entity with id (${id}) already exists`,
  );
}

async function createEntity_errorConflictAttemptingToCreateDifferentStatus({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();

  const entityCreate = copyEntity(TITLE_ONLY_CREATE, { id });

  assertOkResult(await client.createEntity(entityCreate));

  const secondCreateResult = await client.createEntity(entityCreate, { publish: true });
  assertErrorResult(
    secondCreateResult,
    ErrorType.Conflict,
    `Entity with id (${id}) already exists`,
  );
}

async function createEntity_errorConflictAttemptingToCreateDifferentFields({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();

  const entityCreate = copyEntity(TITLE_ONLY_CREATE, { id });

  assertOkResult(await client.createEntity(entityCreate));

  const secondCreateResult = await client.createEntity(
    copyEntity(entityCreate, { fields: { title: 'Another title' } }),
  );
  assertErrorResult(
    secondCreateResult,
    ErrorType.Conflict,
    `Entity with id (${id}) already exists`,
  );
}

async function createEntity_errorAuthKeyNotMatchingPattern({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
  const createResult = await client.createEntity(
    copyEntity(SUBJECT_ONLY_CREATE, { id, info: { authKey: '' as 'subject' } }),
  );
  assertErrorResult(
    createResult,
    ErrorType.BadRequest,
    "info.authKey: AuthKey '' does not match pattern 'subject' (^subject$)",
  );

  const getResult = await client.getEntity({ id });
  assertErrorResult(getResult, ErrorType.NotFound, 'No such entity');
}

async function createEntity_errorMultilineStringInTitle({
  clientProvider,
}: AdminEntityTestContext) {
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
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
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
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
  const client = clientProvider.dossierClient();
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
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
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
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
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
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
  const referenceId = crypto.randomUUID();
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
  const client = clientProvider.dossierClient();
  const referenceId = readOnlyEntityRepository.getMainPrincipalAdminEntities()[0].id;
  const id = crypto.randomUUID();
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
  const client = clientProvider.dossierClient();
  const id = crypto.randomUUID();
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

async function createEntity_errorReadonlySession({ clientProvider }: AdminEntityTestContext) {
  const client = clientProvider.dossierClient('main', 'readonly');
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  assertErrorResult(createResult, ErrorType.BadRequest, 'Readonly session used to create entity');
}
