import type { AdminSchema } from '@jonasb/datadata-core';
import { assertIsDefined } from '@jonasb/datadata-core';
import type { ReadOnlyEntityRepository } from '@jonasb/datadata-database-adapter-test-integration';
import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { afterAll, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlite3Server } from './Sqlite3TestUtils.js';

let serverInit: { server: Server; adminSchema: AdminSchema } | null = null;

let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  serverInit = (
    await initializeSqlite3Server('databases/integration-test-published-entity.sqlite')
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
  'PublishedEntityTest',
  createPublishedEntityTestSuite({
    before: async () => {
      assertIsDefined(serverInit);

      return [
        {
          server: serverInit.server,
          adminSchema: serverInit.adminSchema,
          readOnlyEntityRepository,
        },
        undefined,
      ];
    },
    after: async () => {
      //empty
    },
  })
);
