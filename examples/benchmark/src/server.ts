import type { DatabaseAdapter } from '@dossierhq/server';
import { createServer } from '@dossierhq/server';
import { schemaSpecification } from './schema.js';

export async function initializeServer(databaseAdapter: DatabaseAdapter) {
  const serverResult = await createServer({ databaseAdapter });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const sessionResult = await server.createSession({
    provider: 'sys',
    identifier: 'schemaloader',
    defaultAuthKeys: null,
    logger: null,
    databasePerformance: null,
  });
  if (sessionResult.isError()) return sessionResult;

  const adminClient = server.createAdminClient(sessionResult.value.context);
  const schemaResult = await adminClient.updateSchemaSpecification(schemaSpecification);
  if (schemaResult.isError()) return schemaResult;

  return serverResult;
}
