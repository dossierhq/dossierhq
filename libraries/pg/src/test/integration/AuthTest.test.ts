import { assertIsDefined } from '@dossierhq/core';
import { createMockLogger } from '@dossierhq/core-vitest';
import { createAuthTestSuite, createTestAuthorizationAdapter } from '@dossierhq/integration-test';
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
}, 100000);
afterAll(async () => {
  if (server) {
    (await server.shutdown()).throwIfError();
    server = null;
  }
});

registerTestSuite(
  createAuthTestSuite({
    before: () => {
      assertIsDefined(server);
      return Promise.resolve([{ server }, undefined]);
    },
    after: async () => {
      // empty
    },
  }),
);
