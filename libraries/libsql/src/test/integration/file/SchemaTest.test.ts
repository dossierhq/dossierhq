import {
  createSchemaTestSuite,
  createSharedDossierClientProvider,
} from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import { initializeServer, type ServerInit } from '../../LibSqlTestUtils.js';
import { registerTestSuite } from '../../TestUtils.js';

let serverInit: ServerInit | null = null;

beforeAll(async () => {
  serverInit = (
    await initializeServer({
      url: 'file:databases/integration-test-schema.sqlite',
    })
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
