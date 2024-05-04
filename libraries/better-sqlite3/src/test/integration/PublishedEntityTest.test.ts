import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
  createSharedClientProvider,
  type ReadOnlyEntityRepository,
} from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { afterAll, assert, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlite3Server } from './Sqlite3TestUtils.js';

let serverInit: { server: Server } | null = null;

let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  serverInit = (
    await initializeSqlite3Server('databases/integration-test-published-entity.sqlite')
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
  'PublishedEntityTest',
  createPublishedEntityTestSuite({
    before: () => {
      assert(serverInit);

      return Promise.resolve([
        {
          server: serverInit.server,
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
