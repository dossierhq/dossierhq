import { createAdminClientProvider, createChangelogTestSuite } from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import type { ServerInit } from './SqlJsTestUtils.js';
import { initializeSqlJsServer } from './SqlJsTestUtils.js';

let serverInit: ServerInit | null = null;

beforeAll(async () => {
  serverInit = (await initializeSqlJsServer()).valueOrThrow();
});
afterAll(async () => {
  if (serverInit) {
    (await serverInit.server.shutdown()).throwIfError();
    serverInit = null;
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
