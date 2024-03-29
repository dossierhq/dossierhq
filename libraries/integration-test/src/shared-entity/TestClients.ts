import type { Server } from '@dossierhq/server';
import type { AppAdminClient, AppPublishedClient } from '../SchemaTypes.js';

export type TestPrincipal = 'main' | 'secondary' | 'random';

export interface AdminClientProvider {
  adminClient: (principal?: TestPrincipal, sessionType?: 'readonly' | 'write') => AppAdminClient;
}

export interface PublishedClientProvider {
  publishedClient: (
    principal?: TestPrincipal,
    sessionType?: 'readonly' | 'write',
  ) => AppPublishedClient;
}

const principals = {
  main: {
    provider: 'test',
    identifier: 'main',
    defaultAuthKeys: [''],
  },
  secondary: {
    provider: 'test',
    identifier: 'secondary',
    defaultAuthKeys: [''],
  },
  random: {
    provider: 'test',
    identifier: 'random',
    defaultAuthKeys: [''],
  },
} as const;

async function sessionForPrincipal(
  server: Server,
  principal: TestPrincipal | undefined,
  sessionType?: 'readonly' | 'write',
) {
  principal ??= 'main';
  const principalConfig = { ...principals[principal] };
  let identifier: string = principalConfig.identifier;
  if (identifier === 'random') {
    identifier = `random-${Math.random()}`;
  }
  return await server.createSession({
    ...principalConfig,
    identifier,
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
    publishedClient(principal, sessionType) {
      const sessionResult = sessionForPrincipal(server, principal, sessionType);
      return server.createPublishedClient(() => sessionResult);
    },
  };
}
