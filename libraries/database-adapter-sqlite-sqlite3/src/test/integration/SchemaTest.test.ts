import { assertIsDefined } from '@jonasb/datadata-core';
import { createSchemaTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { afterAll, beforeAll } from 'vitest';
import { registerTestSuite } from '../TestUtils.js';
import { initializeSqlite3Server } from './Sqlite3TestUtils.js';

let server: Server | null = null;

beforeAll(async () => {
  const result = await initializeSqlite3Server('databases/integration-test-schema.sqlite');
  if (result.isError()) throw result.toError();
  server = result.value;
});
afterAll(async () => {
  if (server) {
    (await server.shutdown()).throwIfError();
    server = null;
  }
});

registerTestSuite(
  'SchemaTest',
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
