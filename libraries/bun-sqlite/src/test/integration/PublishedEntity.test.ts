import type { ReadOnlyEntityRepository } from '@dossierhq/integration-test';
import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
  createSharedClientProvider,
} from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'bun:test';
import assert from 'node:assert';
import type { ServerInit } from '../TestUtils.js';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

let serverInit: ServerInit | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  serverInit = (
    await initializeIntegrationTestServer('databases/integration-test-published-entity.sqlite')
  ).valueOrThrow();
  readOnlyEntityRepository = (
    await createReadOnlyEntityRepository(
      createSharedClientProvider(serverInit.server),
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
          adminSchema: serverInit.adminSchema,
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
