import { assertIsDefined } from '@jonasb/datadata-core';
import { createPublishedEntityTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
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
  createPublishedEntityTestSuite({
    before: async () => {
      assertIsDefined(server);
      const sessionResult = await server.createSession({
        provider: 'test',
        identifier: 'id',
        defaultAuthKeys: ['none'],
      });
      if (sessionResult.isError()) throw sessionResult.toError();
      const { context } = sessionResult.value;

      const adminClient = server.createAdminClient(context);
      const publishedClient = server.createPublishedClient(context);
      return [{ adminClient, publishedClient }, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
