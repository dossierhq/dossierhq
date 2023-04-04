import { assertIsDefined } from '@dossierhq/core';
import { createSchemaTestSuite } from '@dossierhq/integration-test';
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
  createSchemaTestSuite({
    before: async () => {
      assertIsDefined(serverInit);
      return [serverInit, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
