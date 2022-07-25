import { createAdvisoryLockTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { initializeIntegrationTestServer, registerTestSuite } from './TestUtils.js';

registerTestSuite(
  createAdvisoryLockTestSuite({
    before: async () => {
      const server = (
        await initializeIntegrationTestServer('databases/integration-test-advisory-lock.sqlite')
      ).valueOrThrow();
      return [{ server }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  })
);
