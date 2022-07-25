import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@jonasb/datadata-database-adapter-test-integration';
import { Server } from '@jonasb/datadata-server';
import { initializeIntegrationTestServer, registerTestSuite } from './TestUtils.js';

registerTestSuite(
  createAdminEntityTestSuite({
    before: async () => {
      const server = (
        await initializeIntegrationTestServer('databases/integration-test-admin-entity.sqlite')
      ).valueOrThrow();

      const sessionResult = server.createSession({
        provider: 'test',
        identifier: 'id',
        defaultAuthKeys: ['none'],
      });
      const client = server.createAdminClient(() => sessionResult);

      const readOnlyEntityRepository = (
        await createReadOnlyEntityRepository(server)
      ).valueOrThrow();

      //TODO remove client
      return [{ server, client, readOnlyEntityRepository }, { server }];
    },
    after: async ({ server }: { server: Server }) => {
      await server.shutdown();
    },
  })
);
