import { assertIsDefined } from '@dossierhq/core';
import { createAdvisoryLockTestSuite } from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'vitest';
import type { IntegrationTestServerInit } from '../TestUtils.js';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

let serverInit: IntegrationTestServerInit | null = null;

beforeAll(async () => {
  serverInit = (await initializeIntegrationTestServer()).valueOrThrow();
}, 100000);
afterAll(async () => {
  if (serverInit) {
    (await serverInit.server.shutdown()).throwIfError();
    serverInit = null;
  }
});

registerTestSuite(
  'AdvisoryLockTest',
  createAdvisoryLockTestSuite({
    before: () => {
      assertIsDefined(serverInit);
      const { server } = serverInit;
      return Promise.resolve([{ server }, undefined]);
    },
    after: async () => {
      // empty
    },
  }),
);
