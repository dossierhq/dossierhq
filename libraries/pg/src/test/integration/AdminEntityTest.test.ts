import {
  createAdminEntityTestSuite,
  createDossierClientProvider,
  createReadOnlyEntityRepository,
  createSharedDossierClientProvider,
  type ReadOnlyEntityRepository,
} from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import {
  initializeIntegrationTestServer,
  registerTestSuite,
  type IntegrationTestServerInit,
} from '../TestUtils.js';

let serverInit: IntegrationTestServerInit | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  serverInit = (await initializeIntegrationTestServer()).valueOrThrow();
  readOnlyEntityRepository = (
    await createReadOnlyEntityRepository(createDossierClientProvider(serverInit.server))
  ).valueOrThrow();
}, 100000);
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
          clientProvider: createSharedDossierClientProvider(server),
          server,
          readOnlyEntityRepository,
        },
        undefined,
      ]);
    },
    after: async () => {
      // empty
    },
  }),
);
