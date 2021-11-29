import { assertIsDefined } from '@jonasb/datadata-core';
import {
  createAuthTestSuite,
  createTestAuthenticationAdapter,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { createServer } from '@jonasb/datadata-server';
import { createSqlJsTestAdapter, registerTestSuite } from '../../TestUtils';

let server: Server | null = null;

beforeAll(async () => {
  const databaseAdapterResult = await createSqlJsTestAdapter();
  if (databaseAdapterResult.isError()) {
    throw databaseAdapterResult.toError();
  }

  const createServerResult = await createServer({
    databaseAdapter: databaseAdapterResult.value,
    authenticationAdapter: createTestAuthenticationAdapter(),
  });
  if (createServerResult.isError()) {
    return createServerResult;
  }
  server = createServerResult.value;
});
afterAll(async () => {
  if (server) {
    await server.shutdown();
  }
});

registerTestSuite(
  createAuthTestSuite({
    before: async () => {
      assertIsDefined(server);
      return [{ server }, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
