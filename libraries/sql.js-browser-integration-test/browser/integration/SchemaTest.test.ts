import { createSchemaTestSuite } from '@dossierhq/integration-test';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlJsServer } from './SqlJsTestUtils.js';

registerTestSuite(
  'SchemaTest',
  createSchemaTestSuite({
    before: async () => {
      const serverInit = (await initializeSqlJsServer()).valueOrThrow();
      return [serverInit, serverInit];
    },
    after: async (serverInit) => {
      await serverInit.server.shutdown();
    },
  }),
);
