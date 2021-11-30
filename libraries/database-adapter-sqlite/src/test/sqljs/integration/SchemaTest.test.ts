import { assertIsDefined } from '@jonasb/datadata-core';
import {
  createSchemaTestSuite,
  createTestAuthorizationAdapter,
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
    authorizationAdapter: createTestAuthorizationAdapter(),
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
  createSchemaTestSuite({
    before: async () => {
      assertIsDefined(server);
      const sessionResult = await server.createSession({
        provider: 'test',
        identifier: 'id',
        defaultAuthKeys: ['none'],
      });
      if (sessionResult.isError()) {
        throw sessionResult.toError();
      }
      const { context } = sessionResult.value;
      const client = server.createAdminClient(context);

      return [{ client }, undefined];
    },
    after: async () => {
      //empty
    },
  })
);
