import type { DossierClient, ErrorType, PromiseResult, PublishedClient } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
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
  { adminClient: DossierClient; publishedClient: PublishedClient },
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
  const adminClient = server.createDossierClient(context, [
    createFilesystemAdminMiddleware(server, server.createDossierClient(context), 'data'),
  ]);
  const publishedClient = server.createPublishedClient(context);
  return ok({ adminClient, publishedClient });
}

export async function getServerConnection(): Promise<{ server: Server }> {
  if (!serverConnectionPromise) {
    serverConnectionPromise = (async () => {
      return (await initializeServer()).valueOrThrow();
    })();
  }

  return serverConnectionPromise;
}
