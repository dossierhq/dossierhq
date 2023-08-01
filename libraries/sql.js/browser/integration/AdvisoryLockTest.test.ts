import { createAdvisoryLockTestSuite } from '@dossierhq/integration-test';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlJsServer } from './SqlJsTestUtils.js';

registerTestSuite(
  'AdvisoryLockTest',
  createAdvisoryLockTestSuite({
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
