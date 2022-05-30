import { AdminSchema, Logger } from '@jonasb/datadata-core';
import {
  createDatabase,
  createSqlite3Adapter,
} from '@jonasb/datadata-database-adapter-sqlite-sqlite3';
import {
  AuthorizationAdapter,
  createServer,
  NoneAndSubjectAuthorizationAdapter,
  Server,
} from '@jonasb/datadata-server';
import { Database } from 'sqlite3';
import SchemaSpec from './schema.json';

const SQLITE3_DATABASE = 'data/foo.sqlite';

export async function initializeServer(logger: Logger) {
  const databaseResult = await createDatabase({ logger }, Database, {
    filename: SQLITE3_DATABASE,
    journalMode: 'wal',
  });
  if (databaseResult.isError()) return databaseResult;

  const adapterResult = await createSqlite3Adapter({ logger }, databaseResult.value);
  if (adapterResult.isError()) return adapterResult;

  const serverResult = await createServer({
    databaseAdapter: adapterResult.value,
    authorizationAdapter: createAuthorizationAdapter(),
    logger,
  });
  return serverResult;
}

export async function updateSchema(server: Server) {
  const sessionResult = server.createSession({
    provider: 'sys',
    identifier: 'schemaloader',
    defaultAuthKeys: [],
  });

  const adminClient = server.createAdminClient(() => sessionResult);

  const schemaResult = await adminClient.updateSchemaSpecification(SchemaSpec);
  return new AdminSchema(schemaResult.valueOrThrow().schemaSpecification);
}

function createAuthorizationAdapter(): AuthorizationAdapter {
  return NoneAndSubjectAuthorizationAdapter;
}
