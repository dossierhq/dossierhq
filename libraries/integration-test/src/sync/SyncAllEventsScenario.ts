import {
  EntityStatus,
  EventType,
  FieldType,
  type SchemaSpecificationWithMigrations,
} from '@dossierhq/core';
import { assertEquals, assertResultValue } from '../Asserts.js';
import { assertSyncEventsEqual } from '../shared-entity/EventsTestUtils.js';
import {
  applyEventsOnTargetAndResolveNextContext,
  createPrincipalSyncAndInitializeScenarioContext,
  ensureServerIsEmpty,
} from './SyncScenarioUtils.js';
import type { ScenarioContext, SyncTestContext } from './SyncTestSuite.js';

const STEPS: ((context: ScenarioContext) => Promise<ScenarioContext>)[] = [
  sync_allEventsScenario_1_updateSchema,
  sync_allEventsScenario_2_createEntity,
  sync_allEventsScenario_3_createAndPublishEntity,
  sync_allEventsScenario_4_updateEntity,
  sync_allEventsScenario_5_updateAndPublishEntity,
  sync_allEventsScenario_6_publishEntities,
  sync_allEventsScenario_7_unpublishEntities,
  sync_allEventsScenario_8_archiveEntity,
  sync_allEventsScenario_9_unarchiveEntity,
];

const TITLE_ONLY_ENTITY_ID_1 = 'b1793e40-285c-423f-b4f8-e71fa74677b8';
const TITLE_ONLY_ENTITY_ID_2 = 'd56b4262-0d00-4507-b909-7a1eb19bb82f';

export async function sync_allEventsScenario(context: SyncTestContext) {
  const { sourceServer, targetServer } = context;

  await ensureServerIsEmpty(sourceServer);
  await ensureServerIsEmpty(targetServer);

  let scenarioContext = await createPrincipalSyncAndInitializeScenarioContext(context);

  for (const step of STEPS) {
    scenarioContext = await step(scenarioContext);
  }
}

async function sync_allEventsScenario_1_updateSchema(context: ScenarioContext) {
  const { sourceClient, targetClient, createdBy, after } = context;

  const expectedSchemaSpecification: SchemaSpecificationWithMigrations = {
    entityTypes: [
      {
        name: 'TitleOnly',
        publishable: true,
        authKeyPattern: null,
        nameField: 'title',
        fields: [
          {
            name: 'title',
            type: FieldType.String,
            multiline: false,
            adminOnly: false,
            index: null,
            list: false,
            matchPattern: null,
            required: false,
            values: [],
          },
        ],
      },
    ],
    componentTypes: [],
    indexes: [],
    patterns: [],
    schemaKind: 'full',
    version: 1,
    migrations: [],
  };

  // Update schema
  const { effect, schemaSpecification: sourceSchemaSpecification } = (
    await sourceClient.updateSchemaSpecification(
      {
        entityTypes: [
          {
            name: 'TitleOnly',
            nameField: 'title',
            fields: [{ name: 'title', type: FieldType.String }],
          },
        ],
      },
      { includeMigrations: true },
    )
  ).valueOrThrow();
  assertEquals(effect, 'updated');
  assertEquals(sourceSchemaSpecification, expectedSchemaSpecification);

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);

  assertSyncEventsEqual(events, [
    {
      type: EventType.updateSchema,
      parentId: after,
      schemaSpecification: expectedSchemaSpecification,
      createdBy,
    },
  ]);

  // Check that the target schema is identical
  const targetSchemaSpecification = (
    await targetClient.getSchemaSpecification({ includeMigrations: true })
  ).valueOrThrow();

  assertEquals(targetSchemaSpecification, sourceSchemaSpecification);

  return nextContext;
}

async function sync_allEventsScenario_2_createEntity(context: ScenarioContext) {
  const { sourceClient, targetClient, after, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_1;

  // Create entity
  const { effect, entity: sourceEntity } = (
    await sourceClient.createEntity({
      id,
      info: { type: 'TitleOnly', name: 'TitleOnly entity' },
      fields: { title: 'Hello' },
    })
  ).valueOrThrow();
  assertEquals(effect, 'created');

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);

  assertSyncEventsEqual(events, [
    {
      type: EventType.createEntity,
      parentId: after,
      createdBy,
      entity: {
        id,
        info: {
          type: 'TitleOnly',
          name: 'TitleOnly entity',
          authKey: '',
          resolvedAuthKey: '',
          schemaVersion: 1,
        },
        fields: { title: 'Hello' },
      },
    },
  ]);

  // Check that the target entity is identical
  const targetEntity = (await targetClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function sync_allEventsScenario_3_createAndPublishEntity(context: ScenarioContext) {
  const { sourceClient, targetClient, after, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_2;

  // Create entity
  const { effect, entity: sourceEntity } = (
    await sourceClient.createEntity(
      {
        id,
        info: { type: 'TitleOnly', name: 'TitleOnly published entity' },
        fields: { title: 'Published' },
      },
      { publish: true },
    )
  ).valueOrThrow();
  assertEquals(effect, 'createdAndPublished');

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);

  assertSyncEventsEqual(events, [
    {
      type: EventType.createAndPublishEntity,
      parentId: after,
      createdBy,
      entity: {
        id,
        info: {
          type: 'TitleOnly',
          name: 'TitleOnly published entity',
          authKey: '',
          resolvedAuthKey: '',
          schemaVersion: 1,
        },
        fields: { title: 'Published' },
      },
    },
  ]);

  // Check that the target entity is identical
  const targetEntity = (await targetClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function sync_allEventsScenario_4_updateEntity(context: ScenarioContext) {
  const { sourceClient, targetClient, after, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_1;

  // Update entity
  const { effect, entity: sourceEntity } = (
    await sourceClient.updateEntity({ id, fields: { title: 'Updated title' } })
  ).valueOrThrow();
  assertEquals(effect, 'updated');

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);
  assertSyncEventsEqual(events, [
    {
      type: EventType.updateEntity,
      parentId: after,
      createdBy,
      entity: {
        id,
        info: {
          name: 'TitleOnly entity',
          version: 2,
          schemaVersion: 1,
        },
        fields: { title: 'Updated title' },
      },
    },
  ]);

  // Check that the target entity is identical
  const targetEntity = (await targetClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function sync_allEventsScenario_5_updateAndPublishEntity(context: ScenarioContext) {
  const { sourceClient, targetClient, after, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_2;

  // Update entity
  const { effect, entity: sourceEntity } = (
    await sourceClient.updateEntity(
      { id, fields: { title: 'Updated published title' } },
      { publish: true },
    )
  ).valueOrThrow();
  assertEquals(effect, 'updatedAndPublished');

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);
  assertSyncEventsEqual(events, [
    {
      type: EventType.updateAndPublishEntity,
      parentId: after,
      createdBy,
      entity: {
        id,
        info: {
          name: 'TitleOnly published entity',
          version: 2,
          schemaVersion: 1,
        },
        fields: { title: 'Updated published title' },
      },
    },
  ]);

  // Check that the target entity is identical
  const targetEntity = (await targetClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function sync_allEventsScenario_6_publishEntities(context: ScenarioContext) {
  const { sourceClient, targetClient, after, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_1;

  // Publish entity
  const publishedResult = await sourceClient.publishEntities([{ id, version: 1 }]);
  const [{ updatedAt }] = publishedResult.valueOrThrow();
  assertResultValue(publishedResult, [{ id, effect: 'published', status: 'modified', updatedAt }]);

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);
  assertSyncEventsEqual(events, [
    {
      type: EventType.publishEntities,
      parentId: after,
      createdBy,
      entities: [{ id, version: 1, publishedName: 'TitleOnly entity' }],
    },
  ]);

  // Check that the target entity is identical
  const sourceEntity = (await sourceClient.getEntity({ id })).valueOrThrow();
  const targetEntity = (await targetClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function sync_allEventsScenario_7_unpublishEntities(context: ScenarioContext) {
  const { sourceClient, targetClient, after, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_1;

  // Unpublish entity
  const unpublishResult = await sourceClient.unpublishEntities([{ id }]);
  const [{ updatedAt }] = unpublishResult.valueOrThrow();
  assertResultValue(unpublishResult, [
    { id, effect: 'unpublished', status: 'withdrawn', updatedAt },
  ]);

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);
  assertSyncEventsEqual(events, [
    {
      type: EventType.unpublishEntities,
      parentId: after,
      createdBy,
      entities: [{ id, version: 1 }],
    },
  ]);

  // Check that the target entity is identical
  const sourceEntity = (await sourceClient.getEntity({ id })).valueOrThrow();
  const targetEntity = (await targetClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function sync_allEventsScenario_8_archiveEntity(context: ScenarioContext) {
  const { sourceClient, targetClient, after, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_1;

  // Archive entity
  const result = await sourceClient.archiveEntity({ id });
  const { updatedAt } = result.valueOrThrow();
  assertResultValue(result, {
    id,
    effect: 'archived',
    status: EntityStatus.archived,
    updatedAt,
  });

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);
  assertSyncEventsEqual(events, [
    {
      type: EventType.archiveEntity,
      parentId: after,
      createdBy,
      entity: { id, version: 2 },
    },
  ]);

  // Check that the target entity is identical
  const sourceEntity = (await sourceClient.getEntity({ id })).valueOrThrow();
  const targetEntity = (await targetClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function sync_allEventsScenario_9_unarchiveEntity(context: ScenarioContext) {
  const { sourceClient, targetClient, after, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_1;

  // Unarchive entity
  const result = await sourceClient.unarchiveEntity({ id });
  const { updatedAt } = result.valueOrThrow();
  assertResultValue(result, {
    id,
    effect: 'unarchived',
    status: EntityStatus.withdrawn,
    updatedAt,
  });

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);
  assertSyncEventsEqual(events, [
    {
      type: EventType.unarchiveEntity,
      parentId: after,
      createdBy,
      entity: { id, version: 2 },
    },
  ]);

  // Check that the target entity is identical
  const sourceEntity = (await sourceClient.getEntity({ id })).valueOrThrow();
  const targetEntity = (await targetClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}
