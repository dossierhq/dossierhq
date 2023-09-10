import {
  AdminEntityStatus,
  EventType,
  FieldType,
  type AdminClient,
  type AdminSchemaSpecificationWithMigrations,
} from '@dossierhq/core';
import { assertEquals, assertOkResult, assertResultValue } from '../Asserts.js';
import { assertSyncEventsEqual } from '../shared-entity/EventsTestUtils.js';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients.js';
import type { SyncTestContext } from './SyncTestSuite.js';

interface ScenarioContext extends SyncTestContext {
  sourceAdminClient: AdminClient;
  targetAdminClient: AdminClient;
  after: string | null;
  createdBy: string;
}

const STEPS: ((context: ScenarioContext) => Promise<ScenarioContext>)[] = [
  sync_allEventsScenario_1_updateSchema,
  sync_allEventsScenario_2_createEntity,
  sync_allEventsScenario_3_createAndPublishEntity,
  sync_allEventsScenario_4_updateEntity,
  sync_allEventsScenario_5_updateAndPublishedEntity,
  sync_allEventsScenario_6_publishEntities,
  sync_allEventsScenario_7_unpublishEntities,
  sync_allEventsScenario_8_archiveEntity,
  sync_allEventsScenario_9_unarchiveEntity,
];

const TITLE_ONLY_ENTITY_ID_1 = 'b1793e40-285c-423f-b4f8-e71fa74677b8';
const TITLE_ONLY_ENTITY_ID_2 = 'd56b4262-0d00-4507-b909-7a1eb19bb82f';

export async function sync_allEventsScenario(context: SyncTestContext) {
  const { sourceServer, targetServer } = context;

  // Ensure the servers are empty
  const initialSyncEvents = (
    await sourceServer.getSyncEvents({ after: null, limit: 10 })
  ).valueOrThrow();
  assertEquals(initialSyncEvents.events.length, 0);

  const initialTargetSyncEvents = (
    await targetServer.getSyncEvents({ after: null, limit: 10 })
  ).valueOrThrow();
  assertEquals(initialTargetSyncEvents.events.length, 0);

  // Create admin clients
  const sourceAdminClient = adminClientForMainPrincipal(sourceServer) as AdminClient;
  const targetAdminClient = adminClientForMainPrincipal(targetServer) as AdminClient;

  let scenarioContext: ScenarioContext = {
    ...context,
    sourceAdminClient,
    targetAdminClient,
    after: null,
    createdBy: 'placeholder',
  };

  for (const step of STEPS) {
    scenarioContext = await step(scenarioContext);
  }
}

async function sync_allEventsScenario_1_updateSchema(context: ScenarioContext) {
  const { sourceAdminClient, targetAdminClient } = context;

  const expectedSchemaSpecification: AdminSchemaSpecificationWithMigrations = {
    entityTypes: [
      {
        name: 'TitleOnly',
        adminOnly: false,
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
    valueTypes: [],
    indexes: [],
    patterns: [],
    schemaKind: 'admin',
    version: 1,
    migrations: [],
  };

  // Update schema
  const { effect, schemaSpecification: sourceSchemaSpecification } = (
    await sourceAdminClient.updateSchemaSpecification(
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

  const createdBy = events[0].createdBy;

  assertSyncEventsEqual(events, [
    { type: EventType.updateSchema, schemaSpecification: expectedSchemaSpecification, createdBy },
  ]);

  // Check that the target schema is identical
  const targetSchemaSpecification = (
    await targetAdminClient.getSchemaSpecification({ includeMigrations: true })
  ).valueOrThrow();

  assertEquals(targetSchemaSpecification, sourceSchemaSpecification);

  return { ...nextContext, createdBy };
}

async function sync_allEventsScenario_2_createEntity(context: ScenarioContext) {
  const { sourceAdminClient, targetAdminClient, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_1;

  // Create entity
  const { effect, entity: sourceEntity } = (
    await sourceAdminClient.createEntity({
      id,
      info: { type: 'TitleOnly', name: 'TitleOnly entity', authKey: 'none' },
      fields: { title: 'Hello' },
    })
  ).valueOrThrow();
  assertEquals(effect, 'created');

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);

  assertSyncEventsEqual(events, [
    {
      type: EventType.createEntity,
      createdBy,
      entity: {
        id,
        info: {
          type: 'TitleOnly',
          name: 'TitleOnly entity',
          authKey: 'none',
          resolvedAuthKey: 'none',
          schemaVersion: 1,
        },
        fields: { title: 'Hello' },
      },
    },
  ]);

  // Check that the target entity is identical
  const targetEntity = (await targetAdminClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function sync_allEventsScenario_3_createAndPublishEntity(context: ScenarioContext) {
  const { sourceAdminClient, targetAdminClient, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_2;

  // Create entity
  const { effect, entity: sourceEntity } = (
    await sourceAdminClient.createEntity(
      {
        id,
        info: { type: 'TitleOnly', name: 'TitleOnly published entity', authKey: 'none' },
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
      createdBy,
      entity: {
        id,
        info: {
          type: 'TitleOnly',
          name: 'TitleOnly published entity',
          authKey: 'none',
          resolvedAuthKey: 'none',
          schemaVersion: 1,
        },
        fields: { title: 'Published' },
      },
    },
  ]);

  // Check that the target entity is identical
  const targetEntity = (await targetAdminClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function sync_allEventsScenario_4_updateEntity(context: ScenarioContext) {
  const { sourceAdminClient, targetAdminClient, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_1;

  // Update entity
  const { effect, entity: sourceEntity } = (
    await sourceAdminClient.updateEntity({ id, fields: { title: 'Updated title' } })
  ).valueOrThrow();
  assertEquals(effect, 'updated');

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);
  assertSyncEventsEqual(events, [
    {
      type: EventType.updateEntity,
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
  const targetEntity = (await targetAdminClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function sync_allEventsScenario_5_updateAndPublishedEntity(context: ScenarioContext) {
  const { sourceAdminClient, targetAdminClient, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_2;

  // Update entity
  const { effect, entity: sourceEntity } = (
    await sourceAdminClient.updateEntity(
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
  const targetEntity = (await targetAdminClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function sync_allEventsScenario_6_publishEntities(context: ScenarioContext) {
  const { sourceAdminClient, targetAdminClient, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_1;

  // Publish entity
  const publishedResult = await sourceAdminClient.publishEntities([{ id, version: 1 }]);
  const [{ updatedAt }] = publishedResult.valueOrThrow();
  assertResultValue(publishedResult, [{ id, effect: 'published', status: 'modified', updatedAt }]);

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);
  assertSyncEventsEqual(events, [
    {
      type: EventType.publishEntities,
      createdBy,
      entities: [{ id, version: 1, publishedName: 'TitleOnly entity' }],
    },
  ]);

  // Check that the target entity is identical
  const sourceEntity = (await sourceAdminClient.getEntity({ id })).valueOrThrow();
  const targetEntity = (await targetAdminClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function sync_allEventsScenario_7_unpublishEntities(context: ScenarioContext) {
  const { sourceAdminClient, targetAdminClient, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_1;

  // Unpublish entity
  const unpublishResult = await sourceAdminClient.unpublishEntities([{ id }]);
  const [{ updatedAt }] = unpublishResult.valueOrThrow();
  assertResultValue(unpublishResult, [
    { id, effect: 'unpublished', status: 'withdrawn', updatedAt },
  ]);

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);
  assertSyncEventsEqual(events, [
    {
      type: EventType.unpublishEntities,
      createdBy,
      entities: [{ id, version: 1 }],
    },
  ]);

  // Check that the target entity is identical
  const sourceEntity = (await sourceAdminClient.getEntity({ id })).valueOrThrow();
  const targetEntity = (await targetAdminClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function sync_allEventsScenario_8_archiveEntity(context: ScenarioContext) {
  const { sourceAdminClient, targetAdminClient, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_1;

  // Archive entity
  const result = await sourceAdminClient.archiveEntity({ id });
  const { updatedAt } = result.valueOrThrow();
  assertResultValue(result, {
    id,
    effect: 'archived',
    status: AdminEntityStatus.archived,
    updatedAt,
  });

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);
  assertSyncEventsEqual(events, [
    {
      type: EventType.archiveEntity,
      createdBy,
      entity: { id, version: 2 },
    },
  ]);

  // Check that the target entity is identical
  const sourceEntity = (await sourceAdminClient.getEntity({ id })).valueOrThrow();
  const targetEntity = (await targetAdminClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function sync_allEventsScenario_9_unarchiveEntity(context: ScenarioContext) {
  const { sourceAdminClient, targetAdminClient, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_1;

  // Unarchive entity
  const result = await sourceAdminClient.unarchiveEntity({ id });
  const { updatedAt } = result.valueOrThrow();
  assertResultValue(result, {
    id,
    effect: 'unarchived',
    status: AdminEntityStatus.withdrawn,
    updatedAt,
  });

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);
  assertSyncEventsEqual(events, [
    {
      type: EventType.unarchiveEntity,
      createdBy,
      entity: { id, version: 2 },
    },
  ]);

  // Check that the target entity is identical
  const sourceEntity = (await sourceAdminClient.getEntity({ id })).valueOrThrow();
  const targetEntity = (await targetAdminClient.getEntity({ id })).valueOrThrow();
  assertEquals(targetEntity, sourceEntity);

  return nextContext;
}

async function applyEventsOnTargetAndResolveNextContext(context: ScenarioContext) {
  const { sourceServer, targetServer, after } = context;

  // Apply source events on target server

  const sourceSyncEvents = (await sourceServer.getSyncEvents({ after, limit: 10 })).valueOrThrow();

  let expectedHead = after;
  for (const syncEvent of sourceSyncEvents.events) {
    assertOkResult(await targetServer.applySyncEvent(expectedHead, syncEvent));
    expectedHead = syncEvent.id;
  }

  const targetSyncEvents = (await targetServer.getSyncEvents({ after, limit: 10 })).valueOrThrow();

  assertEquals(targetSyncEvents.events, sourceSyncEvents.events);

  // Process all dirty entities
  for (const server of [sourceServer, targetServer]) {
    let processOneMore = true;
    while (processOneMore) {
      const info = (await server.processNextDirtyEntity()).valueOrThrow();
      processOneMore = !!info;
    }
  }

  // Construct nextContext

  const nextContext = { ...context, after: expectedHead };

  return { nextContext, events: sourceSyncEvents.events };
}
