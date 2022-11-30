import { createAdvisoryLockTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlJsServer } from './SqlJsTestUtils.js';

registerTestSuite(
  createAdvisoryLockTestSuite({
    before: async () => {
      const serverInit = (await initializeSqlJsServer()).valueOrThrow();
      const { server } = serverInit;
      return [{ server }, serverInit];
    },
    after: async (serverInit) => {
      await serverInit.server.shutdown();
    },
  })
);
