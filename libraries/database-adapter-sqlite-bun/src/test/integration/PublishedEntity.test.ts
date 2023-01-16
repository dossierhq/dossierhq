import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@dossierhq/database-adapter-test-integration';
import type { Server } from '@dossierhq/server';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

registerTestSuite(
  'PublishedEntityTest',
  createPublishedEntityTestSuite({
    before: async () => {
      const { adminSchema, server } = (
        await initializeIntegrationTestServer('databases/integration-test-published-entity.sqlite')
      ).valueOrThrow();

      const readOnlyEntityRepository = (
        await createReadOnlyEntityRepository(server, 'published-entity')
      ).valueOrThrow();

      return [{ adminSchema, server, readOnlyEntityRepository }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  })
);
