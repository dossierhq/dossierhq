import { assertIsDefined } from '@jonasb/datadata-core';
import type { ReadOnlyEntityRepository } from '@jonasb/datadata-database-adapter-test-integration';
import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils';

let server: Server | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  const result = await initializeIntegrationTestServer();
  if (result.isError()) {
    throw result.toError();
  }
  server = result.value;
  readOnlyEntityRepository = await createReadOnlyEntityRepository(server);
});
afterAll(async () => {
  if (server) {
    (await server.shutdown()).throwIfError();
    server = null;
  }
});

registerTestSuite(
  createAdminEntityTestSuite({
    before: async () => {
      assertIsDefined(server);
      const resolvedServer = server;
      const client = resolvedServer.createAdminClient(() =>
        resolvedServer.createSession({
          provider: 'test',
          identifier: 'id',
          defaultAuthKeys: ['none'],
        })
      );
      //TODO remove client
      return [{ server, client, readOnlyEntityRepository }, undefined];
    },
    after: async () => {
      // empty
    },
  })
);
