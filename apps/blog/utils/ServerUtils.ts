import {
  notOk,
  ok,
  type DossierClient,
  type ErrorType,
  type PromiseResult,
  type PublishedDossierClient,
} from '@dossierhq/core';
import type { DatabasePerformanceCallbacks, Server } from '@dossierhq/server';
import type { NextApiRequest } from 'next';
import { SYSTEM_USERS } from '../config/SystemUsers';
import { createFilesystemAdminMiddleware } from './FileSystemSerializer';
import { initializeServer } from './SharedServerUtils';

let serverConnectionPromise: Promise<{ server: Server }> | null = null;

export async function getSessionContextForRequest(
  server: Server,
  _req: NextApiRequest,
  databasePerformance: DatabasePerformanceCallbacks,
): PromiseResult<
  { client: DossierClient; publishedClient: PublishedDossierClient },
  typeof ErrorType.NotAuthenticated
> {
  //TODO actually authenticate
  const sessionResult = await server.createSession({
    ...SYSTEM_USERS.editor,
    defaultAuthKeys: null,
    logger: null,
    databasePerformance,
  });
  if (sessionResult.isError()) {
    return notOk.NotAuthenticated(
      `Failed authentication: ${sessionResult.error}: ${sessionResult.message}`,
    );
  }
  const { context } = sessionResult.value;
  const client = server.createDossierClient(context, [
    createFilesystemAdminMiddleware(server, server.createDossierClient(context), 'data'),
  ]);
  const publishedClient = server.createPublishedClient(context);
  return ok({ client, publishedClient });
}

export async function getServerConnection(): Promise<{ server: Server }> {
  if (!serverConnectionPromise) {
    serverConnectionPromise = (async () => {
      return (await initializeServer()).valueOrThrow();
    })();
  }

  return serverConnectionPromise;
}
