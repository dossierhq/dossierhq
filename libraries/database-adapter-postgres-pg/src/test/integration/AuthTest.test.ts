import { assertIsDefined } from '@jonasb/datadata-core';
import { createAuthTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import { AuthContext, createServer, Server, Server2 } from '@jonasb/datadata-server';
import { createMockLogger, createPostgresTestAdapter, registerTestSuite } from '../TestUtils';

let server: Server | null = new Server({ databaseAdapter: createPostgresTestAdapter() });
let server2: Server2 | null = null;
let authContext: AuthContext | null = server.createAuthContext();

beforeAll(async () => {
  const result = await createServer({
    databaseAdapter: createPostgresTestAdapter(),
    logger: createMockLogger(),
  });
  if (result.isError()) {
    throw result.toError();
  }
  server2 = result.value;
});
afterAll(async () => {
  await server!.shutdown();
  server = null;
  authContext = null;
  if (server2) {
    (await server2.shutdown()).throwIfError();
    server2 = null;
  }
});

registerTestSuite(
  createAuthTestSuite({
    before: async () => {
      assertIsDefined(authContext);
      assertIsDefined(server2);
      return [{ authContext, server: server2 }, undefined];
    },
    after: async () => {},
  })
);
