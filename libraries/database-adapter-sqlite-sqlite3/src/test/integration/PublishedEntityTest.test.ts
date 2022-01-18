import { assertIsDefined } from '@jonasb/datadata-core';
import type { ReadOnlyEntityRepository } from '@jonasb/datadata-database-adapter-test-integration';
import {
  createPublishedEntityTestSuite,
  createReadOnlyEntityRepository,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { registerTestSuite } from '../TestUtils';
import { initializeSqlite3Server } from './Sqlite3TestUtils';

let server: Server | null = null;
let readOnlyEntityRepository: ReadOnlyEntityRepository;

beforeAll(async () => {
  const result = await initializeSqlite3Server(
    'databases/integration-test-published-entity.sqlite'
  );
  if (result.isError()) throw result.toError();
  server = result.value;
  readOnlyEntityRepository = await createReadOnlyEntityRepository(server);
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
