import type { AdminSchema } from '@dossierhq/core';
import type { ReadOnlyEntityRepository } from '@dossierhq/integration-test';
import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
  createSharedClientProvider,
} from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { afterAll, assert, beforeAll } from 'vitest';
import { initializeServer } from '../../LibSqlTestUtils.js';
import { registerTestSuite } from '../../TestUtils.js';
import { createSqldProcess, type SqldProcess } from './SqldRunner.js';

let sqldProcess: SqldProcess | null = null;
let serverInit: { server: Server; adminSchema: AdminSchema } | null = null;

let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  sqldProcess = await createSqldProcess('published-entity', '127.0.0.1:9003');
  serverInit = (
    await initializeServer({ url: sqldProcess.url }, { journalMode: undefined })
  ).valueOrThrow();

  readOnlyEntityRepository = (
    await createReadOnlyEntityRepository(createSharedClientProvider(serverInit.server))
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
  'PublishedEntityTest',
  createPublishedEntityTestSuite({
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
