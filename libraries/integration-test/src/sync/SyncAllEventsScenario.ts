import {
  EventType,
  FieldType,
  type AdminClient,
  type AdminSchemaSpecificationWithMigrations,
  type ArchiveEntitySyncEvent,
  type CreateEntitySyncEvent,
  type PublishEntitiesSyncEvent,
  type SyncEvent,
  type UnarchiveEntitySyncEvent,
  type UnpublishEntitiesSyncEvent,
  type UpdateEntitySyncEvent,
  type UpdateSchemaSyncEvent,
} from '@dossierhq/core';
import { assertEquals, assertOkResult } from '../Asserts.js';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients.js';
import type { SyncTestContext } from './SyncTestSuite.js';

interface ScenarioContext extends SyncTestContext {
  sourceAdminClient: AdminClient;
  after: string | null;
  createdBy: string;
}

const TITLE_ONLY_ENTITY_ID_1 = 'b1793e40-285c-423f-b4f8-e71fa74677b8';
const TITLE_ONLY_ENTITY_ID_2 = 'd56b4262-0d00-4507-b909-7a1eb19bb82f';

export async function sync_allEventsScenario(context: SyncTestContext) {
  const { sourceServer, targetServer } = context;

  // Ensure the servers are empty
  const initialSyncEvents = (
    await sourceServer.getSyncEvents({ initial: true, limit: 10 })
  ).valueOrThrow();
  assertEquals(initialSyncEvents.events.length, 0);

  const initialTargetSyncEvents = (
    await targetServer.getSyncEvents({ initial: true, limit: 10 })
  ).valueOrThrow();
  assertEquals(initialTargetSyncEvents.events.length, 0);

  // Create admin client

  const sourceAdminClient = adminClientForMainPrincipal(sourceServer) as AdminClient;

  const scenarioContext: ScenarioContext = {
    ...context,
    sourceAdminClient,
    after: null,
    createdBy: 'placeholder',
  };

  await sync_allEventsScenario_1_updateSchema(scenarioContext);
}

async function sync_allEventsScenario_1_updateSchema(context: ScenarioContext) {
  const { sourceAdminClient } = context;

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

  const { effect, schemaSpecification } = (
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
  assertEquals(schemaSpecification, expectedSchemaSpecification);

  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext(context);

  const createdBy = events[0].createdBy;

  assertSyncEventsEqual(events, [
    { type: EventType.updateSchema, schemaSpecification: expectedSchemaSpecification, createdBy },
  ]);

  await sync_allEventsScenario_2_createEntity({ ...nextContext, createdBy });
}

async function sync_allEventsScenario_2_createEntity(context: ScenarioContext) {
  const { sourceAdminClient, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_1;

  const { effect, entity: _ } = (
    await sourceAdminClient.createEntity({
      id,
      info: { type: 'TitleOnly', name: 'TitleOnly entity', authKey: 'none' },
      fields: { title: 'Hello' },
    })
  ).valueOrThrow();
  assertEquals(effect, 'created');

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

  await sync_allEventsScenario_3_createAndPublishEntity(nextContext);
}

async function sync_allEventsScenario_3_createAndPublishEntity(context: ScenarioContext) {
  const { sourceAdminClient, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_2;

  const { effect, entity: _ } = (
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

  await sync_allEventsScenario_4_updateEntity(nextContext);
}

async function sync_allEventsScenario_4_updateEntity(context: ScenarioContext) {
  const { sourceAdminClient, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_1;

  const { effect, entity: _ } = (
    await sourceAdminClient.updateEntity({ id, fields: { title: 'Updated title' } })
  ).valueOrThrow();
  assertEquals(effect, 'updated');

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

  await sync_allEventsScenario_5_updateAndPublishedEntity(nextContext);
}

async function sync_allEventsScenario_5_updateAndPublishedEntity(context: ScenarioContext) {
  const { sourceAdminClient, createdBy } = context;

  const id = TITLE_ONLY_ENTITY_ID_2;

  const { effect, entity: _ } = (
    await sourceAdminClient.updateEntity(
      { id, fields: { title: 'Updated published title' } },
      { publish: true },
    )
  ).valueOrThrow();
  assertEquals(effect, 'updatedAndPublished');

  const { events, nextContext: _1 } = await applyEventsOnTargetAndResolveNextContext(context);
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
}

async function applyEventsOnTargetAndResolveNextContext(context: ScenarioContext) {
  const { sourceServer, targetServer, after } = context;

  const sourceSyncEvents = (
    await sourceServer.getSyncEvents(after ? { after, limit: 10 } : { initial: true, limit: 10 })
  ).valueOrThrow();

  let expectedHead = after;
  for (const syncEvent of sourceSyncEvents.events) {
    assertOkResult(await targetServer.applySyncEvent(expectedHead, syncEvent));
    expectedHead = syncEvent.id;
  }

  const targetSyncEvents = (
    await targetServer.getSyncEvents(after ? { after, limit: 10 } : { initial: true, limit: 10 })
  ).valueOrThrow();

  assertEquals(targetSyncEvents.events, sourceSyncEvents.events);

  const nextContext = { ...context, after: expectedHead };

  return { nextContext, events: sourceSyncEvents.events };
}

type WithCreatedAt<T extends SyncEvent> = Omit<T, 'id' | 'createdAt'>;

type SyncEventWithoutIdAndCreatedAt =
  | WithCreatedAt<UpdateSchemaSyncEvent>
  | WithCreatedAt<CreateEntitySyncEvent>
  | WithCreatedAt<UpdateEntitySyncEvent>
  | WithCreatedAt<PublishEntitiesSyncEvent>
  | WithCreatedAt<UnpublishEntitiesSyncEvent>
  | WithCreatedAt<ArchiveEntitySyncEvent>
  | WithCreatedAt<UnarchiveEntitySyncEvent>;

function assertSyncEventsEqual(
  actualEvents: SyncEvent[],
  expectedEvents: SyncEventWithoutIdAndCreatedAt[],
) {
  assertEquals(actualEvents.length, expectedEvents.length);
  for (let i = 0; i < actualEvents.length; i++) {
    const { id, createdAt, ...actualEvent } = actualEvents[i];
    assertEquals(actualEvent, expectedEvents[i]);
  }
}
