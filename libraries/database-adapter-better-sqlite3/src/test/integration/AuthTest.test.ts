import { assertIsDefined } from '@jonasb/datadata-core';
import { createAuthTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import { afterAll, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import type { ServerInit } from './Sqlite3TestUtils.js';
import { initializeSqlite3Server } from './Sqlite3TestUtils.js';

let serverInit: ServerInit | null = null;

beforeAll(async () => {
  serverInit = (
    await initializeSqlite3Server('databases/integration-test-auth.sqlite')
  ).valueOrThrow();
});
afterAll(async () => {
  if (serverInit) {
    (await serverInit.server.shutdown()).throwIfError();
    serverInit = null;
  }
});

registerTestSuite(
  'AuthTest',
  createAuthTestSuite({
    before: async () => {
      assertIsDefined(serverInit);
      return [{ server: serverInit.server }, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
