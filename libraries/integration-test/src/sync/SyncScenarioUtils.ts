import { assertOkResult, ErrorType, EventType, type DossierClient } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { assertEquals, assertErrorResult, assertResultValue, assertTruthy } from '../Asserts.js';
import { assertSyncEventsEqual } from '../shared-entity/EventsTestUtils.js';
import { createDossierClientProvider } from '../shared-entity/TestClients.js';
import type { ScenarioContext, SyncTestContext } from './SyncTestSuite.js';

export async function ensureServerIsEmpty(server: Server) {
  const initialSyncEvents = (await server.getSyncEvents({ after: null, limit: 10 })).valueOrThrow();
  assertEquals(initialSyncEvents.events.length, 0);

  assertResultValue(await server.getPrincipals(), null);
}

export async function createPrincipalSyncAndInitializeScenarioContext(context: SyncTestContext) {
  const { sourceServer, targetServer } = context;

  // Setup source Dossier client
  const sourceClient = createDossierClientProvider(sourceServer).dossierClient() as DossierClient;
  // Use source Dossier client to force lazy creation of the main principal
  assertErrorResult(
    await sourceClient.getEntity({ id: crypto.randomUUID() }),
    ErrorType.NotFound,
    'No such entity',
  );

  // Get source principals
  assertResultValue(await sourceServer.getPrincipalsTotalCount(), 1);
  const sourcePrincipalConnection = (await sourceServer.getPrincipals()).valueOrThrow();
  assertTruthy(sourcePrincipalConnection);
  const sourcePrincipals = sourcePrincipalConnection.edges.map((it) => it.node.valueOrThrow());
  assertEquals(sourcePrincipals.length, 1);

  const createdBy = sourcePrincipalConnection.edges[0].node.valueOrThrow().subjectId;

  // Apply sync events
  const { events, nextContext } = await applyEventsOnTargetAndResolveNextContext({
    ...context,
    after: null,
  });

  assertSyncEventsEqual(events, [
    {
      type: EventType.createPrincipal,
      parentId: null,
      createdBy,
      provider: 'test',
      identifier: 'main',
    },
  ]);

  // Check that the target principals are identical
  assertResultValue(await targetServer.getPrincipalsTotalCount(), 1);
  const targetPrincipalConnection = (await targetServer.getPrincipals()).valueOrThrow();
  assertTruthy(targetPrincipalConnection);
  const targetPrincipals = targetPrincipalConnection.edges.map((it) => it.node.valueOrThrow());
  assertEquals(targetPrincipals, sourcePrincipals);

  // Create target Dossier client after the principals have been created
  const targetClient = createDossierClientProvider(targetServer).dossierClient() as DossierClient;

  const scenarioContext: ScenarioContext = {
    ...context,
    sourceClient,
    targetClient,
    createdBy,
    after: nextContext.after,
  };

  return scenarioContext;
}

export async function applyEventsOnTargetAndResolveNextContext<
  TContext extends Pick<ScenarioContext, 'sourceServer' | 'targetServer' | 'after'>,
>(context: TContext) {
  const { sourceServer, targetServer, after } = context;

  // Apply source events on target server

  const sourceSyncEvents = (await sourceServer.getSyncEvents({ after, limit: 10 })).valueOrThrow();

  let nextAfter = after;
  for (const syncEvent of sourceSyncEvents.events) {
    assertOkResult(await targetServer.applySyncEvent(syncEvent));
    nextAfter = syncEvent.id;
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

  const nextContext = { ...context, after: nextAfter };

  return { nextContext, events: sourceSyncEvents.events };
}
