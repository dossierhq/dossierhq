import { createChangelogTestSuite, createDossierClientProvider } from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import {
  initializeIntegrationTestServer,
  registerTestSuite,
  type IntegrationTestServerInit,
} from '../TestUtils.js';

let serverInit: IntegrationTestServerInit | null = null;

beforeAll(async () => {
  serverInit = (await initializeIntegrationTestServer()).valueOrThrow();
}, 100_000);
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
        { clientProvider: createDossierClientProvider(serverInit.server) },
        undefined,
      ]);
    },
    after: async () => {
      // empty
    },
  }),
);
