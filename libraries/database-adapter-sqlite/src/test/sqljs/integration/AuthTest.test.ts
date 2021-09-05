import { assertIsDefined } from '@jonasb/datadata-core';
import { createAuthTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import type { AuthContext } from '@jonasb/datadata-server';
import { Server } from '@jonasb/datadata-server';
import { createSqlJsTestAdapter, registerTestSuite } from '../../TestUtils';

let server: Server | null = null;
let authContext: AuthContext | null;

beforeAll(async () => {
  const databaseAdapterResult = await createSqlJsTestAdapter();
  if (databaseAdapterResult.isError()) {
    throw databaseAdapterResult.toError();
  }
  server = new Server({ databaseAdapter: databaseAdapterResult.value });
  authContext = server.createAuthContext();
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
    before: () => {
      assertIsDefined(authContext);
      return [authContext, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
