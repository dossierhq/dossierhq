import { assertIsDefined } from '@jonasb/datadata-core';
import type { ReadOnlyEntityRepository } from '@jonasb/datadata-database-adapter-test-integration';
import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { afterAll, beforeAll } from 'vitest';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

let server: Server | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  const serverResult = await initializeIntegrationTestServer();
  server = serverResult.valueOrThrow();
  readOnlyEntityRepository = (await createReadOnlyEntityRepository(server)).valueOrThrow();
});
afterAll(async () => {
  if (server) {
    (await server.shutdown()).throwIfError();
    server = null;
  }
});

registerTestSuite(
  createAdminEntityTestSuite({
    before: async () => {
      assertIsDefined(server);
      return [{ server, readOnlyEntityRepository }, undefined];
    },
    after: async () => {
      // empty
    },
  })
);
