import {
  createAdvisoryLockTestSuite,
  createDossierClientProvider,
} from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlite3Server, type ServerInit } from './Sqlite3TestUtils.js';

let serverInit: ServerInit | null = null;

beforeAll(async () => {
  serverInit = (
    await initializeSqlite3Server('databases/integration-test-advisory-lock.sqlite')
  ).valueOrThrow();
});
afterAll(async () => {
  if (serverInit) {
    (await serverInit.server.shutdown()).throwIfError();
    serverInit = null;
  }
});

registerTestSuite(
  'AdvisoryLockTest',
  createAdvisoryLockTestSuite({
    before: () => {
      assert(serverInit);

      return Promise.resolve([
        { clientProvider: createDossierClientProvider(serverInit.server) },
        undefined,
      ]);
    },
    after: async () => {
      //empty
    },
  }),
);
