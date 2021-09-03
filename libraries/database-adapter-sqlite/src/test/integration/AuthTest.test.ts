import { createAuthTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import { AuthContext, Server } from '@jonasb/datadata-server';
import { createSqliteTestAdapter, registerTestSuite } from '../TestUtils';

let server: Server | null = null;
let authContext: AuthContext | null;

beforeAll(async () => {
  server = new Server({ databaseAdapter: await createSqliteTestAdapter() });
  authContext = server.createAuthContext();
});
afterAll(async () => {
  await server!.shutdown();
  server = null;
  authContext = null;
});

registerTestSuite(
  createAuthTestSuite({
    before: () => [authContext!, undefined],
    after: async () => {},
  })
);
