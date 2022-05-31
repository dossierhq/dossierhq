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
      const sessionResult = await server.createSession({
        provider: 'test',
        identifier: 'id',
        defaultAuthKeys: ['none'],
      });
      const { context } = sessionResult.valueOrThrow();

      const readOnlyEntityRepository = (
        await createReadOnlyEntityRepository(server)
      ).valueOrThrow();
      //TODO remove clients
      const adminClient = server.createAdminClient(context);
      const publishedClient = server.createPublishedClient(context);
      return [{ server, adminClient, publishedClient, readOnlyEntityRepository }, undefined];
    },
    after: async () => {
      // empty
    },
  })
);
