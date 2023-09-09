import type { AdminClient, ErrorType, PromiseResult, PublishedClient } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type { DatabasePerformanceCallbacks, Server } from '@dossierhq/server';
import type { NextApiRequest } from 'next';
import { DEFAULT_AUTH_KEYS } from '../config/AuthKeyConfig';
import { createFilesystemAdminMiddleware } from './FileSystemSerializer';
import { initializeServer } from './SharedServerUtils';

let serverConnectionPromise: Promise<{ server: Server }> | null = null;

export async function getSessionContextForRequest(
  server: Server,
  _req: NextApiRequest,
  databasePerformance: DatabasePerformanceCallbacks,
): PromiseResult<
  { adminClient: AdminClient; publishedClient: PublishedClient },
  typeof ErrorType.NotAuthenticated
> {
  //TODO actually authenticate
  const sessionResult = await server.createSession({
    provider: 'test',
    identifier: 'john-smith',
    defaultAuthKeys: DEFAULT_AUTH_KEYS,
    logger: null,
    databasePerformance,
  });
  if (sessionResult.isError()) {
    return notOk.NotAuthenticated(
      `Failed authentication: ${sessionResult.error}: ${sessionResult.message}`,
    );
  }
  const { context } = sessionResult.value;
  const adminClient = server.createAdminClient(context, [
    createFilesystemAdminMiddleware(server, server.createAdminClient(context)),
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
