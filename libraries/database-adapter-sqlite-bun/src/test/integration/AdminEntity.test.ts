import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

registerTestSuite(
  'AdminEntityTest',
  createAdminEntityTestSuite({
    before: async () => {
      const { adminSchema, server } = (
        await initializeIntegrationTestServer('databases/integration-test-admin-entity.sqlite')
      ).valueOrThrow();

      const readOnlyEntityRepository = (
        await createReadOnlyEntityRepository(server, 'admin-entity')
      ).valueOrThrow();

      return [{ adminSchema, server, readOnlyEntityRepository }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  })
);
