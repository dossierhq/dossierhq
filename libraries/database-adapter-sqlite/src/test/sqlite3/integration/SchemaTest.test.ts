import { assertIsDefined } from '@jonasb/datadata-core';
import {
  createSchemaTestSuite,
  createTestAuthenticationAdapter,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { createServer } from '@jonasb/datadata-server';
import { createSqlite3TestAdapter, registerTestSuite } from '../../TestUtils';

let server: Server | null = null;

beforeAll(async () => {
  const databaseAdapterResult = await createSqlite3TestAdapter();
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
      //empty
    },
  })
);
