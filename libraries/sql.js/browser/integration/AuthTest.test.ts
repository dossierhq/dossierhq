import { createAuthTestSuite } from '@dossierhq/integration-test';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlJsServer } from './SqlJsTestUtils.js';

registerTestSuite(
  'AuthTest',
  createAuthTestSuite({
    before: async () => {
      const serverInit = (await initializeSqlJsServer()).valueOrThrow();
      const { server } = serverInit;
      return [{ server }, serverInit];
    },
    after: async (serverInit) => {
      await serverInit.server.shutdown();
    },
  }),
);
