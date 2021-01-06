import type { PromiseResult, SchemaSpecification } from '@datadata/core';
import { ErrorType, ok, Schema } from '@datadata/core';
import type { AuthContext, SessionContext } from '@datadata/server';
import { Auth, Server } from '@datadata/server';
import type { NextApiRequest } from 'next';
import SchemaSpec from './schema.json';

let server: Server | null = null;
let authContext: AuthContext | null = null;

async function ensureSession(authContext: AuthContext, provider: string, identifier: string) {
  let sessionResult = await Auth.createSessionForPrincipal(authContext, provider, identifier);
  if (sessionResult.isOk()) {
    return sessionResult.value;
  }
  if (sessionResult.error !== ErrorType.NotFound) {
    throw sessionResult.toError();
  }

  // Create new principal
  const createResult = await Auth.createPrincipal(authContext, provider, identifier);
  if (createResult.isError()) {
    throw createResult.toError();
  }

  sessionResult = await Auth.createSessionForPrincipal(authContext, provider, identifier);
  if (sessionResult.isError()) {
    throw sessionResult.toError();
  }

  return sessionResult.value;
}

export async function getSessionContextForRequest(
  server: Server,
  authContext: AuthContext,
  req: NextApiRequest
): PromiseResult<SessionContext, ErrorType.NotAuthenticated> {
  //TODO actually authenticate
  const session = await ensureSession(authContext, 'test', 'john-smith');
  return ok(server.createSessionContext(session));
}

export async function getServerConnection(): Promise<{ server: Server; authContext: AuthContext }> {
  if (!server || !authContext) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    server = new Server({ databaseUrl: process.env.DATABASE_URL! });
    authContext = server.createAuthContext();

    const session = await ensureSession(authContext, 'sys', 'schemaloader');
    const context = server.createSessionContext(session);
    const loadSchema = await server.setSchema(
      context,
      new Schema(SchemaSpec as SchemaSpecification)
    );
    loadSchema.throwIfError();
  }
  return { server, authContext };
}
