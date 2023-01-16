import { createAuthTestSuite } from '@dossierhq/database-adapter-test-integration';
import type { Server } from '@dossierhq/server';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

registerTestSuite(
  'AuthTest',
  createAuthTestSuite({
    before: async () => {
      const { server } = (
        await initializeIntegrationTestServer('databases/integration-test-auth.sqlite')
      ).valueOrThrow();
      return [{ server }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  })
);
