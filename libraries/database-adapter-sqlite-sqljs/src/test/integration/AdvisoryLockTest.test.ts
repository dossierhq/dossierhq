import { assertIsDefined } from '@dossierhq/core';
import { createAdvisoryLockTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import { afterAll, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import type { ServerInit } from './SqlJsTestUtils.js';
import { initializeSqlJsServer } from './SqlJsTestUtils.js';

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
  createAdvisoryLockTestSuite({
    before: async () => {
      assertIsDefined(serverInit);
      const { server } = serverInit;
      return [{ server }, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
