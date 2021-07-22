import type { AdminClient, ErrorType, PromiseResult, PublishedClient } from '@jonasb/datadata-core';
import { ok, Schema } from '@jonasb/datadata-core';
import type { AuthContext } from '@jonasb/datadata-server';
import {
  Auth,
  createServerAdminClient,
  createServerPublishedClient,
  Server,
} from '@jonasb/datadata-server';
import type { NextApiRequest } from 'next';
import SchemaSpec from './schema.json';

let serverConnectionPromise: Promise<{ server: Server; authContext: AuthContext }> | null = null;

async function ensureSession(authContext: AuthContext, provider: string, identifier: string) {
  const result = await Auth.createSessionForPrincipal(authContext, provider, identifier, {
    createPrincipalIfMissing: true,
  });
  if (result.isOk()) {
    return result.value;
  }
  throw result.toError();
}

export async function getSessionContextForRequest(
  server: Server,
  authContext: AuthContext,
  req: NextApiRequest
): PromiseResult<
  { adminClient: AdminClient; publishedClient: PublishedClient },
  ErrorType.NotAuthenticated
> {
  //TODO actually authenticate
  const session = await ensureSession(authContext, 'test', 'john-smith');
  const sessionContext = server.createSessionContext(session);
  const adminClient = createServerAdminClient({ context: sessionContext });
  const publishedClient = createServerPublishedClient({ context: sessionContext });
  return ok({ adminClient, publishedClient });
}

export async function getServerConnection(): Promise<{ server: Server; authContext: AuthContext }> {
  if (!serverConnectionPromise) {
    serverConnectionPromise = (async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const server = new Server({ databaseUrl: process.env.DATABASE_URL! });
      const authContext = server.createAuthContext();

      const session = await ensureSession(authContext, 'sys', 'schemaloader');
      const context = server.createSessionContext(session);
      const loadSchema = await server.setSchema(context, new Schema(SchemaSpec));
      loadSchema.throwIfError();
      return { server, authContext };
    })();
  }

  return serverConnectionPromise;
}
