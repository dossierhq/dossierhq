import type { ErrorType, PromiseResult } from '@dossierhq/core';
import type { Server, SessionContext } from '@dossierhq/server';
import type { AppAdminClient, AppPublishedClient } from '../SchemaTypes.js';

const mainPrincipal = {
  provider: 'test',
  identifier: 'main',
  defaultAuthKeys: ['none'],
} as const;

const secondaryPrincipal = {
  provider: 'test',
  identifier: 'secondary',
  defaultAuthKeys: ['none'],
} as const;

export async function sessionForMainPrincipal(
  server: Server,
): PromiseResult<SessionContext, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const result = await server.createSession({
    ...mainPrincipal,
    logger: null,
    databasePerformance: null,
  });
  if (result.isError()) return result;
  return result.map((it) => it.context);
}

export function adminClientForMainPrincipal(server: Server): AppAdminClient {
  const sessionResult = server.createSession({
    ...mainPrincipal,
    logger: null,
    databasePerformance: null,
  });
  return server.createAdminClient(() => sessionResult);
}

export function adminClientForSecondaryPrincipal(server: Server): AppAdminClient {
  const sessionResult = server.createSession({
    ...secondaryPrincipal,
    logger: null,
    databasePerformance: null,
  });
  return server.createAdminClient(() => sessionResult);
}

export function publishedClientForMainPrincipal(server: Server): AppPublishedClient {
  const sessionResult = server.createSession({
    ...mainPrincipal,
    logger: null,
    databasePerformance: null,
  });
  return server.createPublishedClient(() => sessionResult);
}

export function publishedClientForSecondaryPrincipal(server: Server): AppPublishedClient {
  const sessionResult = server.createSession({
    ...secondaryPrincipal,
    logger: null,
    databasePerformance: null,
  });
  return server.createPublishedClient(() => sessionResult);
}
