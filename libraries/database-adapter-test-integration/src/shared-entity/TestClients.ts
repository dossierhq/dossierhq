import type { AdminClient, ErrorType, PromiseResult, PublishedClient } from '@jonasb/datadata-core';
import type { Server, SessionContext } from '@jonasb/datadata-server';

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
  server: Server
): PromiseResult<SessionContext, ErrorType.BadRequest | ErrorType.Generic> {
  const result = await server.createSession(mainPrincipal);
  if (result.isError()) return result;
  return result.map((it) => it.context);
}

export function adminClientForMainPrincipal(server: Server): AdminClient {
  return server.createAdminClient(() => server.createSession(mainPrincipal));
}

export function adminClientForSecondaryPrincipal(server: Server): AdminClient {
  return server.createAdminClient(() => server.createSession(secondaryPrincipal));
}

export function publishedClientForMainPrincipal(server: Server): PublishedClient {
  return server.createPublishedClient(() => server.createSession(mainPrincipal));
}

export function publishedClientForSecondaryPrincipal(server: Server): PublishedClient {
  return server.createPublishedClient(() => server.createSession(secondaryPrincipal));
}
