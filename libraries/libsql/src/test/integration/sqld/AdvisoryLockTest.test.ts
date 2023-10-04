import { assertIsDefined } from '@dossierhq/core';
import { createAdvisoryLockTestSuite } from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'vitest';
import type { ServerInit } from '../../LibSqlTestUtils.js';
import { initializeServer } from '../../LibSqlTestUtils.js';
import { registerTestSuite } from '../../TestUtils.js';
import { createSqldProcess, type SqldProcess } from './SqldRunner.js';

let sqldProcess: SqldProcess | null = null;
let serverInit: ServerInit | null = null;

beforeAll(async () => {
  sqldProcess = await createSqldProcess('advisory-lock-entity', '127.0.0.1:9001');
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
  'AdvisoryLockTest',
  createAdvisoryLockTestSuite({
    before: () => {
      assertIsDefined(serverInit);
      return Promise.resolve([{ server: serverInit.server }, undefined]);
    },
    after: async () => {
      //empty
    },
  }),
);
