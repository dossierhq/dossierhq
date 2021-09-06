import { assertIsDefined } from '@jonasb/datadata-core';
import { createAuthTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import type { Server2 } from '@jonasb/datadata-server';
import { createServer } from '@jonasb/datadata-server';
import { createDummyLogger, createSqlite3TestAdapter, registerTestSuite } from '../../TestUtils';

let server: Server2 | null = null;

beforeAll(async () => {
  const databaseAdapterResult = await createSqlite3TestAdapter();
  if (databaseAdapterResult.isError()) {
    throw databaseAdapterResult.toError();
  }

  const createServerResult = await createServer({
    databaseAdapter: databaseAdapterResult.value,
    logger: createDummyLogger(),
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
