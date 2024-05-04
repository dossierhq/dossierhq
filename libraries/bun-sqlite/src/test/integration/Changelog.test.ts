import assert from 'node:assert/strict';
import { createChangelogTestSuite, createDossierClientProvider } from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'bun:test';
import {
  initializeIntegrationTestServer,
  registerTestSuite,
  type ServerInit,
} from '../TestUtils.js';

let serverInit: ServerInit | null = null;

beforeAll(async () => {
  serverInit = (
    await initializeIntegrationTestServer('databases/integration-test-changelog.sqlite')
  ).valueOrThrow();
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
        { clientProvider: createDossierClientProvider(serverInit.server) },
        undefined,
      ]);
    },
    after: async () => {
      //empty
    },
  }),
);
