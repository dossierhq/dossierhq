import { createSchemaTestSuite, createSharedClientProvider } from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import type { ServerInit } from '../../LibSqlTestUtils.js';
import { initializeServer } from '../../LibSqlTestUtils.js';
import { registerTestSuite } from '../../TestUtils.js';

let serverInit: ServerInit | null = null;

beforeAll(async () => {
  serverInit = (
    await initializeServer({ url: 'file:databases/integration-test-schema.sqlite' })
  ).valueOrThrow();
});
afterAll(async () => {
  if (serverInit) {
    (await serverInit.server.shutdown()).throwIfError();
    serverInit = null;
  }
});

registerTestSuite(
  'SchemaTest',
  createSchemaTestSuite({
    before: () => {
      assert(serverInit);
      const { server } = serverInit;
      return Promise.resolve([
        { server, clientProvider: createSharedClientProvider(server) },
        undefined,
      ]);
    },
    after: async () => {
      //empty
    },
  }),
);
