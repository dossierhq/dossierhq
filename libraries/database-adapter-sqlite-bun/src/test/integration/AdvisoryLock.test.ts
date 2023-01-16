import { createAdvisoryLockTestSuite } from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

registerTestSuite(
  'AdvisoryLockTest',
  createAdvisoryLockTestSuite({
    before: async () => {
      const { server } = (
        await initializeIntegrationTestServer('databases/integration-test-advisory-lock.sqlite')
      ).valueOrThrow();
      return [{ server }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  })
);
