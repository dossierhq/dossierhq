import { assertIsDefined } from '@dossierhq/core';
import { createSchemaTestSuite } from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'vitest';
import { registerTestSuite } from '../../TestUtils.js';
import type { ServerInit } from '../../LibSqlTestUtils.js';
import { initializeServer } from '../../LibSqlTestUtils.js';
import { createSqldProcess, type SqldProcess } from './SqldRunner.js';

let sqldProcess: SqldProcess | null = null;
let serverInit: ServerInit | null = null;

beforeAll(async () => {
  sqldProcess = await createSqldProcess('schema', '127.0.0.1:9004');
  serverInit = (
    await initializeServer({ url: sqldProcess.url }, { journalMode: undefined })
  ).valueOrThrow();
});
afterAll(async () => {
  if (serverInit) {
    (await serverInit.server.shutdown()).throwIfError();
    serverInit = null;
  }
  if (sqldProcess) {
    sqldProcess.close();
  }
});

registerTestSuite(
  'SchemaTest',
  createSchemaTestSuite({
    before: () => {
      assertIsDefined(serverInit);
      return Promise.resolve([serverInit, undefined]);
    },
    after: async () => {
      //empty
    },
  }),
);
