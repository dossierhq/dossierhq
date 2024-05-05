import {
  createSchemaTestSuite,
  createSharedDossierClientProvider,
} from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlite3Server, type ServerInit } from './Sqlite3TestUtils.js';

let serverInit: ServerInit | null = null;

beforeAll(async () => {
  serverInit = (
    await initializeSqlite3Server('databases/integration-test-schema.sqlite')
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
