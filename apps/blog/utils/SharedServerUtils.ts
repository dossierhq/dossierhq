import { AdminSchema, ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-server';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@jonasb/datadata-server';
import { SYSTEM_USERS } from '../config/SystemUsers';
import { schemaSpecification } from './schema';

// This file is used by both next and bun

export async function createServerAndInitializeSchema(databaseAdapter: DatabaseAdapter) {
  const serverResult = await createServer({
    databaseAdapter,
    authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const sessionResult = await server.createSession(SYSTEM_USERS.schemaLoader);
  if (sessionResult.isError()) return sessionResult;

  const client = server.createAdminClient(sessionResult.value.context);
  const schemaResult = await client.updateSchemaSpecification(schemaSpecification);
  if (schemaResult.isError()) return schemaResult;

  return ok({ server, schema: new AdminSchema(schemaResult.value.schemaSpecification) });
}
