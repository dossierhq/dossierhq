import { createSyncTestSuite } from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { initializeEmptyIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

registerTestSuite(
  'SyncTest',
  createSyncTestSuite({
    before: async () => {
      const sourceServer = (
        await initializeEmptyIntegrationTestServer({ selector: 'a' })
      ).valueOrThrow();
      const targetServer = (
        await initializeEmptyIntegrationTestServer({ selector: 'b' })
      ).valueOrThrow();
      return [
        { sourceServer, targetServer },
        { sourceServer, targetServer },
      ];
    },
    after: async ({
      sourceServer,
      targetServer,
    }: {
      sourceServer: Server;
      targetServer: Server;
    }) => {
      (await sourceServer.shutdown()).throwIfError();
      (await targetServer.shutdown()).throwIfError();
    },
  }),
);
