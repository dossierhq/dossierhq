import { createChangelogTestSuite } from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'bun:test';
import assert from 'node:assert';
import type { ServerInit } from '../TestUtils.js';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

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
      return Promise.resolve([{ server: serverInit.server }, undefined]);
    },
    after: async () => {
      //empty
    },
  }),
);
