import type { ReadOnlyEntityRepository } from '@dossierhq/integration-test';
import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
  createSharedClientProvider,
} from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import type { ServerInit } from './Sqlite3TestUtils.js';
import { initializeSqlite3Server } from './Sqlite3TestUtils.js';

let serverInit: ServerInit | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  serverInit = (
    await initializeSqlite3Server('databases/integration-test-admin-entity.sqlite')
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
