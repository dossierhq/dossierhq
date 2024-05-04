import { createChangelogTestSuite, createDossierClientProvider } from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import { initializeServer, type ServerInit } from '../../LibSqlTestUtils.js';
import { registerTestSuite } from '../../TestUtils.js';

let serverInit: ServerInit | null = null;

beforeAll(async () => {
  serverInit = (
    await initializeServer({
      url: 'file:databases/integration-test-changelog.sqlite',
    })
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
