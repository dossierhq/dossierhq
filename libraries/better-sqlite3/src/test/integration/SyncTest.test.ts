import { createSyncTestSuite } from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { registerTestSuite } from '../TestUtils.js';
import { initializeEmptySqlite3Server } from './Sqlite3TestUtils.js';

registerTestSuite(
  'SyncTest',
  createSyncTestSuite({
    before: async () => {
      const sourceServer = (await initializeEmptySqlite3Server(':memory:')).valueOrThrow();
      const targetServer = (await initializeEmptySqlite3Server(':memory:')).valueOrThrow();
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
