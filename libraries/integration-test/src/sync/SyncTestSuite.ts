import type { DossierClient } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { buildSuite } from '../Builder.js';
import type { TestFunctionInitializer, TestSuite } from '../index.js';
import { sync_allEventsScenario } from './SyncAllEventsScenario.js';

export interface SyncTestContext {
  sourceServer: Server;
  targetServer: Server;
}

export interface ScenarioContext extends SyncTestContext {
  sourceClient: DossierClient;
  targetClient: DossierClient;
  after: string | null;
  createdBy: string;
}

export function createSyncTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<SyncTestContext, TCleanup>,
): TestSuite {
  return buildSuite(initializer, sync_allEventsScenario);
}
