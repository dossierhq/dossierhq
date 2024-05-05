import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
  createSharedDossierClientProvider,
} from '@dossierhq/integration-test';
import { afterAll, assert, beforeAll } from 'vitest';
import {
  initializeIntegrationTestServer,
  registerTestSuite,
  type IntegrationTestServerInit,
} from '../TestUtils.js';

let serverInit: IntegrationTestServerInit | null = null;

beforeAll(async () => {
  serverInit = (await initializeIntegrationTestServer()).valueOrThrow();
}, 100000);
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
      assert(serverInit);
      const { server } = serverInit;

      const clientProvider = createSharedDossierClientProvider(server);
      const readOnlyEntityRepository = (
        await createReadOnlyEntityRepository(clientProvider)
      ).valueOrThrow();

      return [{ clientProvider, server, readOnlyEntityRepository }, undefined];
    },
    after: async () => {
      // empty
    },
  }),
);
