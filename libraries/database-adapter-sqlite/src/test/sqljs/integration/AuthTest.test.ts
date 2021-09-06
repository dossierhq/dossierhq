import { assertIsDefined } from '@jonasb/datadata-core';
import { createAuthTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import type { AuthContext, Server2 } from '@jonasb/datadata-server';
import { createServer, Server } from '@jonasb/datadata-server';
import { createDummyLogger, createSqlJsTestAdapter, registerTestSuite } from '../../TestUtils';

let server: Server | null = null;
let authContext: AuthContext | null;
let server2: Server2 | null = null;

beforeAll(async () => {
  const databaseAdapterResult = await createSqlJsTestAdapter();
  if (databaseAdapterResult.isError()) {
    throw databaseAdapterResult.toError();
  }
  server = new Server({ databaseAdapter: databaseAdapterResult.value });
  authContext = server.createAuthContext();

  const databaseAdapter2Result = await createSqlJsTestAdapter();
  if (databaseAdapter2Result.isError()) {
    throw databaseAdapter2Result.toError();
  }

  const createServer2Result = await createServer({
    databaseAdapter: databaseAdapter2Result.value,
    logger: createDummyLogger(),
  });
  if (createServer2Result.isError()) {
    return createServer2Result;
  }
  server2 = createServer2Result.value;
});
afterAll(async () => {
  if (server) {
    await server.shutdown();
  }
  server = null;
  authContext = null;
});

registerTestSuite(
  createAuthTestSuite({
    before: async () => {
      assertIsDefined(authContext);
      assertIsDefined(server2);
      return [{ authContext, server: server2 }, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
