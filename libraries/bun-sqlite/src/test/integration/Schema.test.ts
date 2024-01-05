import { createSchemaTestSuite, createSharedClientProvider } from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'bun:test';
import assert from 'node:assert';
import type { ServerInit } from '../TestUtils.js';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

let serverInit: ServerInit | null = null;

beforeAll(async () => {
  serverInit = (
    await initializeIntegrationTestServer('databases/integration-test-schema.sqlite')
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
