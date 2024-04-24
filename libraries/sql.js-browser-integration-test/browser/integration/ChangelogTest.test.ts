import { createDossierClientProvider, createChangelogTestSuite } from '@dossierhq/integration-test';
import test from '@playwright/test';
import { assertIsDefined, registerTestSuite } from '../TestUtils.js';
import type { ServerInit } from './SqlJsTestUtils.js';
import { initializeSqlJsServer } from './SqlJsTestUtils.js';

let serverInit: ServerInit | null = null;

test.beforeAll(async () => {
  serverInit = (await initializeSqlJsServer()).valueOrThrow();
});
test.afterAll(async () => {
  if (serverInit) {
    (await serverInit.server.shutdown()).throwIfError();
    serverInit = null;
  }
});

registerTestSuite(
  'ChangelogTest',
  createChangelogTestSuite({
    before: () => {
      assertIsDefined(serverInit);
      const { server } = serverInit;
      return Promise.resolve([{ clientProvider: createDossierClientProvider(server) }, undefined]);
    },
    after: async () => {
      //empty
    },
  }),
);
