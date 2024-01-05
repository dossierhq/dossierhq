import type { ReadOnlyEntityRepository } from '@dossierhq/integration-test';
import {
  createAdminClientProvider,
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
  createSharedClientProvider,
} from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import type { ServerInit } from '../../LibSqlTestUtils.js';
import { initializeServer } from '../../LibSqlTestUtils.js';
import { registerTestSuite } from '../../TestUtils.js';
import { createSqldProcess, type SqldProcess } from './SqldRunner.js';

let sqldProcess: SqldProcess | null = null;
let serverInit: ServerInit | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  sqldProcess = await createSqldProcess('admin-entity', '127.0.0.1:9000');
  serverInit = (
    await initializeServer({ url: sqldProcess.url }, { journalMode: undefined })
  ).valueOrThrow();
  readOnlyEntityRepository = (
    await createReadOnlyEntityRepository(createAdminClientProvider(serverInit.server))
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
  'AdminEntityTest',
  createAdminEntityTestSuite({
    before: () => {
      assert(serverInit);
      return Promise.resolve([
        {
          server: serverInit.server,
          adminSchema: serverInit.adminSchema,
          clientProvider: createSharedClientProvider(serverInit.server),
          readOnlyEntityRepository,
        },
        undefined,
      ]);
    },
    after: async () => {
      //empty
    },
  }),
);
