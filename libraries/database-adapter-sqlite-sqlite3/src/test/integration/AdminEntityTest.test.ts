import { assertIsDefined } from '@jonasb/datadata-core';
import type { ReadOnlyEntityRepository } from '@jonasb/datadata-database-adapter-test-integration';
import {
  createAdminEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { registerTestSuite } from '../TestUtils';
import { initializeSqlite3Server } from './Sqlite3TestUtils';

let server: Server | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  server = (
    await initializeSqlite3Server('databases/integration-test-admin-entity.sqlite')
  ).valueOrThrow();
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
      const client = server.createAdminClient(() =>
        resolvedServer.createSession({
          provider: 'test',
          identifier: 'id',
          defaultAuthKeys: ['none'],
        })
      );

      //TODO remove client
      return [{ server, client, readOnlyEntityRepository }, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
