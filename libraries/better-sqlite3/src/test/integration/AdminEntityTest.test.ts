import { assertIsDefined } from '@dossierhq/core';
import type { ReadOnlyEntityRepository } from '@dossierhq/integration-test';
import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'vitest';
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
    await createReadOnlyEntityRepository(serverInit.server)
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
      assertIsDefined(serverInit);
      return Promise.resolve([
        {
          server: serverInit.server,
          adminSchema: serverInit.adminSchema,
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
