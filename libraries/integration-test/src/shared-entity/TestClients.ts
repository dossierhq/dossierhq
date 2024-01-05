import type { ErrorType, PromiseResult } from '@dossierhq/core';
import type { Server, SessionContext } from '@dossierhq/server';
import type { AppAdminClient, AppPublishedClient } from '../SchemaTypes.js';

export type TestPrincipal = 'main' | 'secondary';

export interface AdminClientProvider {
  adminClient: (principal?: TestPrincipal) => AppAdminClient;
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

async function sessionForPrincipal(server: Server, principal: TestPrincipal | undefined) {
  principal ??= 'main';
  const principalConfig = principals[principal];
  return await server.createSession({
    ...principalConfig,
    logger: null,
    databasePerformance: null,
  });
}

export async function sessionForMainPrincipal(
  server: Server,
): PromiseResult<SessionContext, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const result = await sessionForPrincipal(server, 'main');
  if (result.isError()) return result;
  return result.map((it) => it.context);
}

export function createAdminClientProvider(server: Server): AdminClientProvider {
  return {
    adminClient(principal) {
      const sessionResult = sessionForPrincipal(server, principal);
      return server.createAdminClient(() => sessionResult);
    },
  };
}

export function createSharedClientProvider(
  server: Server,
): AdminClientProvider & PublishedClientProvider {
  return {
    adminClient(principal) {
      const sessionResult = sessionForPrincipal(server, principal);
      return server.createAdminClient(() => sessionResult);
    },
    publishedClient(principal) {
      const sessionResult = sessionForPrincipal(server, principal);
      return server.createPublishedClient(() => sessionResult);
    },
  };
}
