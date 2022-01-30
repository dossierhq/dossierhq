import { assertIsDefined, notOk, ok } from '@jonasb/datadata-core';
import { createPostgresAdapter } from '@jonasb/datadata-database-adapter-postgres-pg';
import { AuthorizationAdapter, createServer, SessionContext } from '@jonasb/datadata-server';
import schemaSpecification from './schema.json';

const validAuthorizationKeys: readonly string[] = ['none'];

export async function initializeServer() {
  const connectionString = process.env.EXAMPLES_BENCHMARK_DATABASE_URL;
  assertIsDefined(connectionString);
  const databaseAdapter = createPostgresAdapter({
    connectionString,
  });
  const serverResult = await createServer({
    databaseAdapter,
    authorizationAdapter: createAuthorizationAdapter(),
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const adminClient = server.createAdminClient(() =>
    server.createSession({ provider: 'sys', identifier: 'schemaloader', defaultAuthKeys: ['none'] })
  );
  const schemaResult = await adminClient.updateSchemaSpecification(schemaSpecification);
  if (schemaResult.isError()) return schemaResult;

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
