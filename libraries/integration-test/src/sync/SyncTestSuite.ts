import type { Server } from '@dossierhq/server';
import { buildSuite } from '../Builder.js';
import type { TestFunctionInitializer, TestSuite } from '../index.js';
import { sync_allEventsScenario } from './SyncAllEventsScenario.js';

export interface SyncTestContext {
  sourceServer: Server;
  targetServer: Server;
}

export function createSyncTestSuite<TCleanup>(
  initializer: TestFunctionInitializer<SyncTestContext, TCleanup>,
): TestSuite {
  return buildSuite(initializer, sync_allEventsScenario);
}
