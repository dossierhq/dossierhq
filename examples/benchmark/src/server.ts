import { ErrorType, NoOpLogger, notOk, ok, Result } from '@jonasb/datadata-core';
import {
  createPostgresAdapter,
  type PgDatabaseAdapter,
} from '@jonasb/datadata-database-adapter-postgres-pg';
import {
  createSqlite3Adapter,
  type Sqlite3DatabaseAdapter,
} from '@jonasb/datadata-database-adapter-sqlite-sqlite3';
import { AuthorizationAdapter, createServer, SessionContext } from '@jonasb/datadata-server';
import schemaSpecification from './schema.json';

const validAuthorizationKeys: readonly string[] = ['none'];

export type DatabaseAdapterSelector =
  | { postgresConnectionString: string }
  | { sqliteDatabasePath: string };

export async function initializeServer(adapterSelector: DatabaseAdapterSelector) {
  const databaseAdapterResult: Result<
    Sqlite3DatabaseAdapter,
    ErrorType.BadRequest | ErrorType.Generic
  > =
    'sqliteDatabasePath' in adapterSelector
      ? await createSqliteDatabaseAdapter(adapterSelector.sqliteDatabasePath)
      : createPostgresDatabaseAdapter(adapterSelector.postgresConnectionString);
  if (databaseAdapterResult.isError()) return databaseAdapterResult;

  const serverResult = await createServer({
    databaseAdapter: databaseAdapterResult.value,
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

function createPostgresDatabaseAdapter(
  connectionString: string
): Result<PgDatabaseAdapter, ErrorType.Generic> {
  const databaseAdapter = createPostgresAdapter({ connectionString });
  return ok(databaseAdapter);
}

async function createSqliteDatabaseAdapter(databasePath: string) {
  const adapterResult = await createSqlite3Adapter({ logger: NoOpLogger }, databasePath);
  return adapterResult;
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
