import { assertIsDefined } from '@dossierhq/core';
import type { ReadOnlyEntityRepository } from '@dossierhq/integration-test';
import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@dossierhq/integration-test';
import { afterAll, beforeAll } from 'vitest';
import type { IntegrationTestServerInit } from '../TestUtils.js';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

let serverInit: IntegrationTestServerInit | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  serverInit = (await initializeIntegrationTestServer()).valueOrThrow();
  readOnlyEntityRepository = (
    await createReadOnlyEntityRepository(serverInit.server)
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
      assertIsDefined(serverInit);
      const { adminSchema, server } = serverInit;
      return Promise.resolve([{ adminSchema, server, readOnlyEntityRepository }, undefined]);
    },
    after: async () => {
      // empty
    },
  }),
);
