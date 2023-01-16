import { createSchemaTestSuite } from '@dossierhq/database-adapter-test-integration';
import type { Server } from '@dossierhq/server';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

registerTestSuite(
  'SchemaTest',
  createSchemaTestSuite({
    before: async () => {
      const { server } = (
        await initializeIntegrationTestServer('databases/integration-test-schema.sqlite')
      ).valueOrThrow();

      const sessionResult = server.createSession({
        provider: 'test',
        identifier: 'id',
        defaultAuthKeys: ['none'],
      });
      const client = server.createAdminClient(() => sessionResult);

      return [{ client }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  })
);
