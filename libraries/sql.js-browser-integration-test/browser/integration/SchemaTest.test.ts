import { createSchemaTestSuite, createSharedClientProvider } from '@dossierhq/integration-test';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlJsServer } from './SqlJsTestUtils.js';

registerTestSuite(
  'SchemaTest',
  createSchemaTestSuite({
    before: async () => {
      const serverInit = (await initializeSqlJsServer()).valueOrThrow();
      const { server } = serverInit;
      return [{ server, clientProvider: createSharedClientProvider(server) }, serverInit];
    },
    after: async (serverInit) => {
      await serverInit.server.shutdown();
    },
  }),
);
