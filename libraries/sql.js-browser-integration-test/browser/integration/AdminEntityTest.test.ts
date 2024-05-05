import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
  createSharedDossierClientProvider,
  type ReadOnlyEntityRepository,
} from '@dossierhq/integration-test';
import test from '@playwright/test';
import { assertIsDefined, registerTestSuite } from '../TestUtils.js';
import { initializeSqlJsServer, type ServerInit } from './SqlJsTestUtils.js';

let serverInit: ServerInit | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

test.beforeAll(async () => {
  serverInit = (await initializeSqlJsServer()).valueOrThrow();
  readOnlyEntityRepository = (
    await createReadOnlyEntityRepository(
      createSharedDossierClientProvider(serverInit.server),
      'AdminEntityTest',
    )
  ).valueOrThrow();
});
test.afterAll(async () => {
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
      const { server } = serverInit;
      return Promise.resolve([
        {
          clientProvider: createSharedDossierClientProvider(server),
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
