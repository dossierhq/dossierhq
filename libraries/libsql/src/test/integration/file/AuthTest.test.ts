import { assertIsDefined } from '@dossierhq/core';
import { createAuthTestSuite } from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'vitest';
import { registerTestSuite } from '../../TestUtils.js';
import type { ServerInit } from '../../LibSqlTestUtils.js';
import { initializeServer } from '../../LibSqlTestUtils.js';

let serverInit: ServerInit | null = null;

beforeAll(async () => {
  serverInit = (
    await initializeServer({ url: 'file:databases/integration-test-auth.sqlite' })
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
    before: () => {
      assertIsDefined(serverInit);
      return Promise.resolve([{ server: serverInit.server }, undefined]);
    },
    after: async () => {
      //empty
    },
  }),
);
