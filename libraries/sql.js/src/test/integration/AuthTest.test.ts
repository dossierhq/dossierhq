import { createAuthTestSuite } from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlJsServer, type ServerInit } from './SqlJsTestUtils.js';

let serverInit: ServerInit | null = null;

beforeAll(async () => {
  serverInit = (await initializeSqlJsServer()).valueOrThrow();
});
afterAll(async () => {
  if (serverInit) {
    await serverInit.server.shutdown();
  }
});

registerTestSuite(
  'AuthTest',
  createAuthTestSuite({
    before: () => {
      assert(serverInit);
      const { server } = serverInit;
      return Promise.resolve([{ server }, undefined]);
    },
    after: async () => {
      //empty
    },
  }),
);
