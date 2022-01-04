import { assertIsDefined } from '@jonasb/datadata-core';
import { createAdminEntityTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { registerTestSuite } from '../../TestUtils';
import { initializeSqlJsServer } from './SqlJsTestUtils';

let server: Server | null = null;

beforeAll(async () => {
  const result = await initializeSqlJsServer();
  if (result.isError()) throw result.toError();
  server = result.value;
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
      const client = server.createAdminClient(() =>
        resolvedServer.createSession({
          provider: 'test',
          identifier: 'id',
          defaultAuthKeys: ['none'],
        })
      );

      //TODO remove client
      return [{ server, client }, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
