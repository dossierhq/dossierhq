import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { AdminSchema, ok } from '@dossierhq/core';
import { IntegrationTestSchema, createTestAuthorizationAdapter } from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { createServer } from '@dossierhq/server';
import { createSqlJsTestAdapter } from '../TestUtils.js';

export interface ServerInit {
  server: Server;
  adminSchema: AdminSchema;
}

export async function initializeEmptySqlJsServer(): PromiseResult<
  Server,
  typeof ErrorType.Generic | typeof ErrorType.BadRequest
> {
  const databaseAdapterResult = await createSqlJsTestAdapter();
  if (databaseAdapterResult.isError()) return databaseAdapterResult;

  const createServerResult = await createServer({
    databaseAdapter: databaseAdapterResult.value,
    authorizationAdapter: createTestAuthorizationAdapter(),
  });
  if (createServerResult.isError()) return createServerResult;
  const server = createServerResult.value;

  return ok(server);
}

export async function initializeSqlJsServer(): PromiseResult<
  ServerInit,
  typeof ErrorType.Generic | typeof ErrorType.BadRequest
> {
  const serverResult = await initializeEmptySqlJsServer();
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const sessionResult = server.createSession({
    provider: 'test',
    identifier: 'schema-loader',
    defaultAuthKeys: [],
    logger: null,
    databasePerformance: null,
  });
  const client = server.createAdminClient(() => sessionResult);

  const schemaResult = await client.updateSchemaSpecification(IntegrationTestSchema);
  if (schemaResult.isError()) return schemaResult;
  const adminSchema = new AdminSchema(schemaResult.value.schemaSpecification);

  return ok({ server, adminSchema });
}