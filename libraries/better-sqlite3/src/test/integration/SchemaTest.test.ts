import { assertIsDefined } from '@dossierhq/core';
import { createSchemaTestSuite } from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import type { ServerInit } from './Sqlite3TestUtils.js';
import { initializeSqlite3Server } from './Sqlite3TestUtils.js';

let serverInit: ServerInit | null = null;

beforeAll(async () => {
  serverInit = (
    await initializeSqlite3Server('databases/integration-test-schema.sqlite')
  ).valueOrThrow();
});
afterAll(async () => {
  if (serverInit) {
    (await serverInit.server.shutdown()).throwIfError();
    serverInit = null;
  }
});

registerTestSuite(
  'SchemaTest',
  createSchemaTestSuite({
    before: async () => {
      assertIsDefined(serverInit);
      return [serverInit, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
