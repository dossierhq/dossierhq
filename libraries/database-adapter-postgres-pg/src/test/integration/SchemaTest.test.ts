import { assertIsDefined } from '@jonasb/datadata-core';
import {
  createSchemaTestSuite,
  createTestAuthorizationAdapter,
} from '@jonasb/datadata-database-adapter-test-integration';
import { createMockLogger } from '@jonasb/datadata-core-jest';
import type { Server } from '@jonasb/datadata-server';
import { createServer } from '@jonasb/datadata-server';
import { createPostgresTestAdapter, registerTestSuite } from '../TestUtils';

let server: Server | null = null;

beforeAll(async () => {
  const result = await createServer({
    databaseAdapter: createPostgresTestAdapter(),
    authorizationAdapter: createTestAuthorizationAdapter(),
    logger: createMockLogger(),
  });
  if (result.isError()) {
    throw result.toError();
  }
  server = result.value;
});
afterAll(async () => {
  if (server) {
    (await server.shutdown()).throwIfError();
    server = null;
  }
});

registerTestSuite(
  createSchemaTestSuite({
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
      return [{ client }, undefined];
    },
    after: async () => {
      // empty
    },
  })
);
