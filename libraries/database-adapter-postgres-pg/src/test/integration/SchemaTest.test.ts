import { assertIsDefined } from '@jonasb/datadata-core';
import { createSchemaTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import type { Server2 } from '@jonasb/datadata-server';
import { createServer } from '@jonasb/datadata-server';
import { createMockLogger, createPostgresTestAdapter, registerTestSuite } from '../TestUtils';

let server: Server2 | null = null;

beforeAll(async () => {
  const result = await createServer({
    databaseAdapter: createPostgresTestAdapter(),
    logger: createMockLogger(),
  });
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
  createSchemaTestSuite({
    before: async () => {
      assertIsDefined(server);
      const sessionResult = await server.createSession('test', 'id');
      if (sessionResult.isError()) {
        throw sessionResult.toError();
      }
      const { context } = sessionResult.value;
      const client = server.createAdminClient(context);
      return [{ client }, undefined];
    },
    after: async () => {
      // empty
    },
  })
);
