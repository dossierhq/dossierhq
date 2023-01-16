import { assertIsDefined } from '@dossierhq/core';
import { createMockLogger } from '@dossierhq/core-vitest';
import {
  createSchemaTestSuite,
  createTestAuthorizationAdapter,
} from '@dossierhq/database-adapter-test-integration';
import type { Server } from '@dossierhq/server';
import { createServer } from '@dossierhq/server';
import { afterAll, beforeAll } from 'vitest';
import { createPostgresTestAdapter, registerTestSuite } from '../TestUtils.js';

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

      const sessionResult = resolvedServer.createSession({
        provider: 'test',
        identifier: 'id',
        defaultAuthKeys: ['none'],
      });
      const client = server.createAdminClient(() => sessionResult);
      return [{ client }, undefined];
    },
    after: async () => {
      // empty
    },
  })
);
