import { assertIsDefined } from '@jonasb/datadata-core';
import type { ReadOnlyEntityRepository } from '@jonasb/datadata-database-adapter-test-integration';
import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@jonasb/datadata-database-adapter-test-integration';
import { afterAll, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import type { ServerInit } from './SqlJsTestUtils.js';
import { initializeSqlJsServer } from './SqlJsTestUtils.js';

let serverInit: ServerInit | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  serverInit = (await initializeSqlJsServer()).valueOrThrow();
  readOnlyEntityRepository = (
    await createReadOnlyEntityRepository(serverInit.server)
  ).valueOrThrow();
});
afterAll(async () => {
  if (serverInit) {
    (await serverInit.server.shutdown()).throwIfError();
    serverInit = null;
  }
});

registerTestSuite(
  createAdminEntityTestSuite({
    before: async () => {
      assertIsDefined(serverInit);
      const { server } = serverInit;
      return [{ server, readOnlyEntityRepository }, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
