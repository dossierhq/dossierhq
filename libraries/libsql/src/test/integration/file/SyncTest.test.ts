import { createSyncTestSuite } from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { initializeEmptyServer } from '../../LibSqlTestUtils.js';
import { registerTestSuite } from '../../TestUtils.js';

registerTestSuite(
  'SyncTest',
  createSyncTestSuite({
    before: async () => {
      const sourceServer = (
        await initializeEmptyServer({ url: 'file:databases/integration-test-sync-source.sqlite' })
      ).valueOrThrow();
      const targetServer = (
        await initializeEmptyServer({ url: 'file:databases/integration-test-sync-target.sqlite' })
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
