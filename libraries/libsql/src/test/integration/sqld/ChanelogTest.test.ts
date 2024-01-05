import { createAdminClientProvider, createChangelogTestSuite } from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import type { ServerInit } from '../../LibSqlTestUtils.js';
import { initializeServer } from '../../LibSqlTestUtils.js';
import { registerTestSuite } from '../../TestUtils.js';
import { createSqldProcess, type SqldProcess } from './SqldRunner.js';

let sqldProcess: SqldProcess | null = null;
let serverInit: ServerInit | null = null;

beforeAll(async () => {
  sqldProcess = await createSqldProcess('changelog', '127.0.0.1:9000');
  serverInit = (
    await initializeServer({ url: sqldProcess.url }, { journalMode: undefined })
  ).valueOrThrow();
});
afterAll(async () => {
  if (serverInit) {
    (await serverInit.server.shutdown()).throwIfError();
    serverInit = null;
  }
  if (sqldProcess) {
    sqldProcess.close();
  }
});

registerTestSuite(
  'ChangelogTest',
  createChangelogTestSuite({
    before: () => {
      assert(serverInit);
      return Promise.resolve([
        { clientProvider: createAdminClientProvider(serverInit.server) },
        undefined,
      ]);
    },
    after: async () => {
      //empty
    },
  }),
);
