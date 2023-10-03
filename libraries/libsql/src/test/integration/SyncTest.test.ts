import { createSyncTestSuite } from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { registerTestSuite } from '../TestUtils.js';
import { initializeEmptyServer } from './LibSqlTestUtils.js';

registerTestSuite(
  'SyncTest',
  createSyncTestSuite({
    before: async () => {
      const sourceServer = (await initializeEmptyServer(':memory:')).valueOrThrow();
      const targetServer = (await initializeEmptyServer(':memory:')).valueOrThrow();
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
