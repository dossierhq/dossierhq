import { assertIsDefined } from '@dossierhq/core';
import { createMockLogger } from '@dossierhq/core-vitest';
import {
  createAuthTestSuite,
  createTestAuthorizationAdapter,
} from '@jonasb/datadata-database-adapter-test-integration';
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
  createAuthTestSuite({
    before: async () => {
      assertIsDefined(server);
      return [{ server }, undefined];
    },
    after: async () => {
      // empty
    },
  })
);
