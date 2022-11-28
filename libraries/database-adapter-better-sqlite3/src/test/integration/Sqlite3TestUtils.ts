import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { AdminSchema, NoOpLogger, ok } from '@jonasb/datadata-core';
import {
  createTestAuthorizationAdapter,
  IntegrationTestSchema,
} from '@jonasb/datadata-database-adapter-test-integration';
import type { Server } from '@jonasb/datadata-server';
import { createServer } from '@jonasb/datadata-server';
import Database from 'better-sqlite3';
import type { BetterSqlite3DatabaseAdapter } from '../../BetterSqlite3Adapter.js';
import { createBetterSqlite3Adapter } from '../../BetterSqlite3Adapter.js';

export interface ServerInit {
  server: Server;
  adminSchema: AdminSchema;
}

export async function initializeSqlite3Server(
  filename: string | ':memory:',
  options?: Database.Options
): PromiseResult<ServerInit, typeof ErrorType.Generic | typeof ErrorType.BadRequest> {
  const databaseAdapterResult = await createSqlite3TestAdapter(filename, options);
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
  const adminSchema = new AdminSchema(schemaResult.value.schemaSpecification);

  return ok({ server, adminSchema });
}

async function createSqlite3TestAdapter(
  filename: string | ':memory:',
  options?: Database.Options
): PromiseResult<
  BetterSqlite3DatabaseAdapter,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const context = { logger: NoOpLogger };
  const database = new Database(filename, options);
  database.pragma('journal_mode = WAL');
  return await createBetterSqlite3Adapter(context, database);
}
