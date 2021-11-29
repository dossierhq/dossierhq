import { notOk, ok } from '@jonasb/datadata-core';
import { createPostgresAdapter } from '@jonasb/datadata-database-adapter-postgres-pg';
import { AuthorizationAdapter, createServer, SessionContext } from '@jonasb/datadata-server';

const validAuthorizationKeys: readonly string[] = ['none'];

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
  return {
    async resolveAuthorizationKeys<T extends string>(_context: SessionContext, authKeys: T[]) {
      const result = {} as Record<T, string>;
      for (const key of authKeys) {
        if (!validAuthorizationKeys.includes(key)) {
          return notOk.BadRequest(`Invalid authorization key ${key}`);
        }
        result[key] = key;
      }
      return ok(result);
    },
  };
}
