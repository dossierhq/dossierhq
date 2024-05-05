import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
  createSharedDossierClientProvider,
  type ReadOnlyEntityRepository,
} from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlite3Server, type ServerInit } from './Sqlite3TestUtils.js';

let serverInit: ServerInit | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  serverInit = (
    await initializeSqlite3Server('databases/integration-test-admin-entity.sqlite')
  ).valueOrThrow();
  readOnlyEntityRepository = (
    await createReadOnlyEntityRepository(createSharedDossierClientProvider(serverInit.server))
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
          clientProvider: createSharedDossierClientProvider(serverInit.server),
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
