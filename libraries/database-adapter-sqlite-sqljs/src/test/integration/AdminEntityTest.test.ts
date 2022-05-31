import { assertIsDefined } from '@jonasb/datadata-core';
import type { ReadOnlyEntityRepository } from '@jonasb/datadata-database-adapter-test-integration';
import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { afterAll, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlJsServer } from './SqlJsTestUtils.js';

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
  createAdminEntityTestSuite({
    before: async () => {
      assertIsDefined(server);
      const resolvedServer = server;

      const sessionResult = resolvedServer.createSession({
        provider: 'test',
        identifier: 'id',
        defaultAuthKeys: ['none'],
      });
      const client = server.createAdminClient(() => sessionResult);

      //TODO remove client
      return [{ server, client, readOnlyEntityRepository }, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
