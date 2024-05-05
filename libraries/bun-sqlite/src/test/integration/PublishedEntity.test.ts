import assert from 'node:assert/strict';
import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
  createSharedDossierClientProvider,
  type ReadOnlyEntityRepository,
} from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'bun:test';
import {
  initializeIntegrationTestServer,
  registerTestSuite,
  type ServerInit,
} from '../TestUtils.js';

let serverInit: ServerInit | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  serverInit = (
    await initializeIntegrationTestServer('databases/integration-test-published-entity.sqlite')
  ).valueOrThrow();
  readOnlyEntityRepository = (
    await createReadOnlyEntityRepository(
      createSharedDossierClientProvider(serverInit.server),
      'published-entity',
    )
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
