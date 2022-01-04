import type { AdminClient, PublishedClient } from '@jonasb/datadata-core';
import type { Server } from '@jonasb/datadata-server';

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
