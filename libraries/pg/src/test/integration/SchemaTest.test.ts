import {
  createSchemaTestSuite,
  createSharedDossierClientProvider,
} from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { afterAll, assert, beforeAll } from 'vitest';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

let server: Server | null = null;

beforeAll(async () => {
  const result = await initializeIntegrationTestServer();
  server = result.valueOrThrow().server;
}, 100000);
afterAll(async () => {
  if (server) {
    (await server.shutdown()).throwIfError();
    server = null;
  }
});

registerTestSuite(
  'SchemaTest',
  createSchemaTestSuite({
    before: () => {
      assert(server);
      return Promise.resolve([
        { server, clientProvider: createSharedDossierClientProvider(server) },
        undefined,
      ]);
    },
    after: async () => {
      // empty
    },
  }),
);
