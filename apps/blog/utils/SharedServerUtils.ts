import { ok } from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/server';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@dossierhq/server';

export async function createBlogServer(databaseAdapter: DatabaseAdapter) {
  const serverResult = await createServer({
    databaseAdapter,
    authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  return ok({ server });
}
