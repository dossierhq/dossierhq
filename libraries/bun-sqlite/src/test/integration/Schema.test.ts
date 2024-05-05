import assert from 'node:assert/strict';
import {
  createSchemaTestSuite,
  createSharedDossierClientProvider,
} from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'bun:test';
import {
  initializeIntegrationTestServer,
  registerTestSuite,
  type ServerInit,
} from '../TestUtils.js';

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
        { server, clientProvider: createSharedDossierClientProvider(server) },
        undefined,
      ]);
    },
    after: async () => {
      //empty
    },
  }),
);
