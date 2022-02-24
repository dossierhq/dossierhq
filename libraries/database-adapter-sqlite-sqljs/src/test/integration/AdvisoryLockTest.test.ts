import { assertIsDefined } from '@jonasb/datadata-core';
import { createAdvisoryLockTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { registerTestSuite } from '../TestUtils';
import { initializeSqlJsServer } from './SqlJsTestUtils';

let server: Server | null = null;

beforeAll(async () => {
  const result = await initializeSqlJsServer();
  if (result.isError()) throw result.toError();
  server = result.value;
});
afterAll(async () => {
  if (server) {
    await server.shutdown();
  }
});

registerTestSuite(
  createAdvisoryLockTestSuite({
    before: async () => {
      assertIsDefined(server);
      return [{ server }, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
