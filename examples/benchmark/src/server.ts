import { ErrorType, NoOpLogger, ok, PromiseResult, Result } from '@jonasb/datadata-core';
import {
  createPostgresAdapter,
  type PgDatabaseAdapter,
} from '@jonasb/datadata-database-adapter-postgres-pg';
import {
  createSqlite3Adapter,
  type Sqlite3DatabaseAdapter,
} from '@jonasb/datadata-database-adapter-sqlite-sqlite3';
import {
  AuthorizationAdapter,
  createServer,
  NoneAndSubjectAuthorizationAdapter,
} from '@jonasb/datadata-server';
import fs from 'fs/promises';
import { Client } from 'pg';
import schemaSpecification from './schema.json';

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
      : await createPostgresDatabaseAdapter(adapterSelector.postgresConnectionString);
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

async function createPostgresDatabaseAdapter(
  connectionString: string
): PromiseResult<PgDatabaseAdapter, ErrorType.Generic> {
  // delete database to have consistent results
  const client = new Client({ connectionString });
  await client.connect();
  const {
    rows: [{ count }],
  } = await client.query('SELECT COUNT(*) FROM entities');
  if (count > 0) {
    console.log(`Deleting ${count} entities from database`);
    await client.query('DELETE FROM entities');
  }
  await client.end();

  const databaseAdapter = createPostgresAdapter({ connectionString });
  return ok(databaseAdapter);
}

async function createSqliteDatabaseAdapter(databasePath: string) {
  try {
    // delete database to have consistent results
    await fs.unlink(databasePath);
  } catch (error) {
    // ignore
  }

  const adapterResult = await createSqlite3Adapter({ logger: NoOpLogger }, databasePath);
  return adapterResult;
}

function createAuthorizationAdapter(): AuthorizationAdapter {
  return NoneAndSubjectAuthorizationAdapter;
}
