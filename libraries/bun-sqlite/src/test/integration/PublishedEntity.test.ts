import { assertIsDefined } from '@dossierhq/core';
import type { ReadOnlyEntityRepository } from '@dossierhq/integration-test';
import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'bun:test';
import type { ServerInit } from '../TestUtils.js';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

let serverInit: ServerInit | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  serverInit = (
    await initializeIntegrationTestServer('databases/integration-test-published-entity.sqlite')
  ).valueOrThrow();
  readOnlyEntityRepository = (
    await createReadOnlyEntityRepository(serverInit.server, 'published-entity')
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
