import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
  createSharedClientProvider,
  type ReadOnlyEntityRepository,
} from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlJsServer, type ServerInit } from './SqlJsTestUtils.js';

let serverInit: ServerInit | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  serverInit = (await initializeSqlJsServer()).valueOrThrow();
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
      const { server } = serverInit;
      return Promise.resolve([
        {
          clientProvider: createSharedClientProvider(server),
          server,
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
