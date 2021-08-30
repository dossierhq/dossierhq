import { createAuthTestSuite } from '@jonasb/datadata-database-adapter-test-integration';
import { AuthContext, Server } from '@jonasb/datadata-server';
import { createPostgresTestAdapter, registerTestSuite } from '../TestUtils';

let server: Server | null = new Server({ databaseAdapter: createPostgresTestAdapter() });
let authContext: AuthContext | null = server.createAuthContext();

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
