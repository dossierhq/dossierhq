import { createPostgresAdapter } from '@jonasb/datadata-database-adapter-postgres-pg';
import {
  AuthorizationAdapter,
  createServer,
  NoneAndSubjectAuthorizationAdapter,
} from '@jonasb/datadata-server';

export async function initializeServer() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const databaseAdapter = createPostgresAdapter({ connectionString: process.env.DATABASE_URL! });
  const serverResult = await createServer({
    databaseAdapter,
    authorizationAdapter: createAuthorizationAdapter(),
  });
  return serverResult;
}

function createAuthorizationAdapter(): AuthorizationAdapter {
  return NoneAndSubjectAuthorizationAdapter;
}
