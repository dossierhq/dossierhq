import type { Server } from '@dossierhq/server';
import type { AppAdminClient, AppPublishedClient } from '../SchemaTypes.js';

export type TestPrincipal = 'main' | 'secondary';

export interface AdminClientProvider {
  adminClient: (principal?: TestPrincipal, sessionType?: 'readonly' | 'write') => AppAdminClient;
}

export interface PublishedClientProvider {
  publishedClient: (principal?: TestPrincipal) => AppPublishedClient;
}

const principals = {
  main: {
    provider: 'test',
    identifier: 'main',
    defaultAuthKeys: ['none'],
  },
  secondary: {
    provider: 'test',
    identifier: 'secondary',
    defaultAuthKeys: ['none'],
  },
} as const;

async function sessionForPrincipal(
  server: Server,
  principal: TestPrincipal | undefined,
  sessionType?: 'readonly' | 'write',
) {
  principal ??= 'main';
  const principalConfig = principals[principal];
  return await server.createSession({
    ...principalConfig,
    logger: null,
    databasePerformance: null,
    readonly: sessionType === 'readonly',
  });
}

export function createAdminClientProvider(server: Server): AdminClientProvider {
  return {
    adminClient(principal, sessionType) {
      const sessionResult = sessionForPrincipal(server, principal, sessionType);
      return server.createAdminClient(() => sessionResult);
    },
  };
}

export function createSharedClientProvider(
  server: Server,
): AdminClientProvider & PublishedClientProvider {
  return {
    adminClient(principal, sessionType) {
      const sessionResult = sessionForPrincipal(server, principal, sessionType);
      return server.createAdminClient(() => sessionResult);
    },
    publishedClient(principal) {
      const sessionResult = sessionForPrincipal(server, principal);
      return server.createPublishedClient(() => sessionResult);
    },
  };
}
