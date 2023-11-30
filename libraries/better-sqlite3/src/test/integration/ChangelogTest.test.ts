import { createChangelogTestSuite } from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import type { ServerInit } from './Sqlite3TestUtils.js';
import { initializeSqlite3Server } from './Sqlite3TestUtils.js';

let serverInit: ServerInit | null = null;

beforeAll(async () => {
  serverInit = (
    await initializeSqlite3Server('databases/integration-test-changelog.sqlite')
  ).valueOrThrow();
});
afterAll(async () => {
  if (serverInit) {
    (await serverInit.server.shutdown()).throwIfError();
    serverInit = null;
  }
});

registerTestSuite(
  'ChangelogTest',
  createChangelogTestSuite({
    before: () => {
      assert(serverInit);
      return Promise.resolve([{ server: serverInit.server }, undefined]);
    },
    after: async () => {
      //empty
    },
  }),
);
