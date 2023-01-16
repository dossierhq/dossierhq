import type { AuthorizationAdapter, DatabaseAdapter } from '@dossierhq/server';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@dossierhq/server';
import { schemaSpecification } from './schema.js';

export async function initializeServer(databaseAdapter: DatabaseAdapter) {
  const serverResult = await createServer({
    databaseAdapter,
    authorizationAdapter: createAuthorizationAdapter(),
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const sessionResult = await server.createSession({
    provider: 'sys',
    identifier: 'schemaloader',
    defaultAuthKeys: ['none'],
  });
  if (sessionResult.isError()) return sessionResult;

  const adminClient = server.createAdminClient(sessionResult.value.context);
  const schemaResult = await adminClient.updateSchemaSpecification(schemaSpecification);
  if (schemaResult.isError()) return schemaResult;

  return serverResult;
}

function createAuthorizationAdapter(): AuthorizationAdapter {
  return NoneAndSubjectAuthorizationAdapter;
}
