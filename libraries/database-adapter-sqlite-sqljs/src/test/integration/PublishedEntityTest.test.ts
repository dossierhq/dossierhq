import { assertIsDefined } from '@jonasb/datadata-core';
import type { ReadOnlyEntityRepository } from '@jonasb/datadata-database-adapter-test-integration';
import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { afterAll, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils';
import { initializeSqlJsServer } from './SqlJsTestUtils';

let server: Server | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  server = (await initializeSqlJsServer()).valueOrThrow();
  readOnlyEntityRepository = (await createReadOnlyEntityRepository(server)).valueOrThrow();
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
      if (sessionResult.isError()) throw sessionResult.toError();
      const { context } = sessionResult.value;

      const adminClient = server.createAdminClient(context);
      const publishedClient = server.createPublishedClient(context);
      return [{ server, adminClient, publishedClient, readOnlyEntityRepository }, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
