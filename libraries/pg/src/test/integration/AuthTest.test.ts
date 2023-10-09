import { createAuthTestSuite } from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { afterAll, assert, beforeAll } from 'vitest';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

let server: Server | null = null;

beforeAll(async () => {
  const serverInit = (await initializeIntegrationTestServer()).valueOrThrow();
  server = serverInit.server;
});
afterAll(async () => {
  if (server) {
    (await server.shutdown()).throwIfError();
    server = null;
  }
});

registerTestSuite(
  'AuthTest',
  createAuthTestSuite({
    before: () => {
      assert(server);
      return Promise.resolve([{ server }, undefined]);
    },
    after: async () => {
      // empty
    },
  }),
);
