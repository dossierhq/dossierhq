import type { ReadOnlyEntityRepository } from '@dossierhq/integration-test';
import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
  createSharedClientProvider,
} from '@dossierhq/integration-test';
import test from '@playwright/test';
import { assertIsDefined, registerTestSuite } from '../TestUtils.js';
import type { ServerInit } from './SqlJsTestUtils.js';
import { initializeSqlJsServer } from './SqlJsTestUtils.js';

let serverInit: ServerInit | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

test.beforeAll(async () => {
  serverInit = (await initializeSqlJsServer()).valueOrThrow();
  readOnlyEntityRepository = (
    await createReadOnlyEntityRepository(
      createSharedClientProvider(serverInit.server),
      'PublishedEntityTest',
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
  'PublishedEntityTest',
  createPublishedEntityTestSuite({
    before: () => {
      assertIsDefined(serverInit);
      const { adminSchema, server } = serverInit;
      return Promise.resolve([
        {
          adminSchema,
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
