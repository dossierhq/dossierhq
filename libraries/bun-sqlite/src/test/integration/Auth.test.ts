import { assertIsDefined } from '@dossierhq/core';
import { createAuthTestSuite } from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'bun:test';
import type { ServerInit } from '../TestUtils.js';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

let serverInit: ServerInit | null = null;

beforeAll(async () => {
  serverInit = (
    await initializeIntegrationTestServer('databases/integration-test-auth.sqlite')
  ).valueOrThrow();
});
afterAll(async () => {
  if (serverInit) {
    (await serverInit.server.shutdown()).throwIfError();
    serverInit = null;
  }
});

registerTestSuite(
  'AuthTest',
  createAuthTestSuite({
    before: async () => {
      assertIsDefined(serverInit);
      return [{ server: serverInit.server }, undefined];
    },
    after: async () => {
      //empty
    },
  }),
);
