import { assertIsDefined } from '@jonasb/datadata-core';
import type { ReadOnlyEntityRepository } from '@jonasb/datadata-database-adapter-test-integration';
import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { afterAll, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlite3Server } from './Sqlite3TestUtils.js';

let server: Server | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  server = (
    await initializeSqlite3Server('databases/integration-test-admin-entity.sqlite')
  ).valueOrThrow();
  readOnlyEntityRepository = (await createReadOnlyEntityRepository(server)).valueOrThrow();
});
afterAll(async () => {
  if (server) {
    (await server.shutdown()).throwIfError();
    server = null;
  }
});

registerTestSuite(
  'AdminEntityTest',
  createAdminEntityTestSuite({
    before: async () => {
      assertIsDefined(server);
      return [{ server, readOnlyEntityRepository }, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
