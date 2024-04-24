import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { ok } from '@dossierhq/core';
import { IntegrationTestSchema, createTestAuthorizationAdapter } from '@dossierhq/integration-test';
import type { Server } from '@dossierhq/server';
import { createServer } from '@dossierhq/server';
import { createSqlJsTestAdapter } from '../TestUtils.js';

export interface ServerInit {
  server: Server;
}

export async function initializeSqlJsServer(): PromiseResult<
  ServerInit,
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

  const sessionResult = server.createSession({
    provider: 'test',
    identifier: 'schema-loader',
  });
  const client = server.createDossierClient(() => sessionResult);

  const schemaResult = await client.updateSchemaSpecification(IntegrationTestSchema);
  if (schemaResult.isError()) return schemaResult;

  return ok({ server });
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
