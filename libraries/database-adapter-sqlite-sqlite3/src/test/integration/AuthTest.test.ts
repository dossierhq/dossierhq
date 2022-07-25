import { assertIsDefined } from '@jonasb/datadata-core';
import { createAuthTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { afterAll, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlite3Server } from './Sqlite3TestUtils.js';

let server: Server | null = null;

beforeAll(async () => {
  const result = await initializeSqlite3Server('databases/integration-test-auth.sqlite');

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
  'AuthTest',
  createAuthTestSuite({
    before: async () => {
      assertIsDefined(server);
      return [{ server }, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
