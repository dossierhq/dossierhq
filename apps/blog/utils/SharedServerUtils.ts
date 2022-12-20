import { ok } from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-server';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@jonasb/datadata-server';

export async function createBlogServer(databaseAdapter: DatabaseAdapter) {
  const serverResult = await createServer({
    databaseAdapter,
    authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  return ok({ server });
}
