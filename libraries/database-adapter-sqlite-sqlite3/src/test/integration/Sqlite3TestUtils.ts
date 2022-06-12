import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import {
  createTestAuthorizationAdapter,
  IntegrationTestSchema,
} from '@jonasb/datadata-database-adapter-test-integration';
import { createServer } from '@jonasb/datadata-server';
import { Database } from 'sqlite3';
import { createSqlite3Adapter } from '../../Sqlite3Adapter.js';
import { createDatabase } from '../../SqliteUtils.js';

export async function initializeSqlite3Server(filename: string | ':memory:', mode?: number) {
  const databaseAdapterResult = await createSqlite3TestAdapter(filename, mode);
  if (databaseAdapterResult.isError()) return databaseAdapterResult;

  const createServerResult = await createServer({
    databaseAdapter: databaseAdapterResult.value,
    authorizationAdapter: createTestAuthorizationAdapter(),
  });
  if (createServerResult.isError()) return createServerResult;
  const server = createServerResult.value;

  const sessionResult = server.createSession({
    provider: 'test',
    identifier: 'schema-loader',
    defaultAuthKeys: [],
  });
  const client = server.createAdminClient(() => sessionResult);

  const schemaResult = await client.updateSchemaSpecification(IntegrationTestSchema);
  if (schemaResult.isError()) return schemaResult;

  return createServerResult;
}

async function createSqlite3TestAdapter(
  filename: string | ':memory:',
  mode?: number
): PromiseResult<DatabaseAdapter, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const context = { logger: NoOpLogger };
  const databaseResult = await createDatabase(context, Database, {
    filename,
    mode,
    journalMode: 'wal',
  });
  if (databaseResult.isError()) return databaseResult;
  return await createSqlite3Adapter(context, databaseResult.value);
}
