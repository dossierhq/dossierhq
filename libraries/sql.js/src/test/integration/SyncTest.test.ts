import { createSyncTestSuite } from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { registerTestSuite } from '../TestUtils.js';
import { initializeEmptySqlJsServer } from './SqlJsTestUtils.js';

registerTestSuite(
  'SyncTest',
  createSyncTestSuite({
    before: async () => {
      const sourceServer = (await initializeEmptySqlJsServer()).valueOrThrow();
      const targetServer = (await initializeEmptySqlJsServer()).valueOrThrow();
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
