import { assertIsDefined } from '@jonasb/datadata-core';
import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { afterAll, beforeAll } from 'vitest';
import { initializeIntegrationTestServer, registerTestSuite } from '../TestUtils.js';

let server: Server | null = null;

beforeAll(async () => {
  const result = await initializeIntegrationTestServer();
  if (result.isError()) {
    throw result.toError();
  }
  server = result.value;
});
afterAll(async () => {
  if (server) {
    (await server.shutdown()).throwIfError();
    server = null;
  }
});

registerTestSuite(
  createPublishedEntityTestSuite({
    before: async () => {
      assertIsDefined(server);

      const readOnlyEntityRepository = (
        await createReadOnlyEntityRepository(server)
      ).valueOrThrow();

      return [{ server, readOnlyEntityRepository }, undefined];
    },
    after: async () => {
      // empty
    },
  })
);
