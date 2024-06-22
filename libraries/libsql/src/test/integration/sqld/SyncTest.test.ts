import { createSyncTestSuite } from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { initializeEmptyServer } from '../../LibSqlTestUtils.js';
import { registerTestSuite } from '../../TestUtils.js';
import { createSqldProcess, type SqldProcess } from './SqldRunner.js';

registerTestSuite(
  'SyncTest',
  createSyncTestSuite({
    before: async () => {
      const sourceProcess = await createSqldProcess('sync-source', '127.0.0.1:9006');
      const targetProcess = await createSqldProcess('sync-target', '127.0.0.1:9007');
      const sourceServer = (
        await initializeEmptyServer({ url: sourceProcess.url }, { journalMode: undefined })
      ).valueOrThrow();
      const targetServer = (
        await initializeEmptyServer({ url: targetProcess.url }, { journalMode: undefined })
      ).valueOrThrow();
      return [
        { sourceServer, targetServer },
        { sourceServer, sourceProcess, targetServer, targetProcess },
      ];
    },
    after: async ({
      sourceServer,
      sourceProcess,
      targetServer,
      targetProcess,
    }: {
      sourceServer: Server;
      sourceProcess: SqldProcess;
      targetServer: Server;
      targetProcess: SqldProcess;
    }) => {
      (await sourceServer.shutdown()).throwIfError();
      sourceProcess.close();
      (await targetServer.shutdown()).throwIfError();
      targetProcess.close();
    },
  }),
);
