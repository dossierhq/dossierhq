import type { Server } from '@dossierhq/server';
import type { AppDossierClient, AppPublishedClient } from '../SchemaTypes.js';

export type TestPrincipal = 'main' | 'secondary' | 'random';

export interface DossierClientProvider {
  dossierClient: (
    principal?: TestPrincipal,
    sessionType?: 'readonly' | 'write',
  ) => AppDossierClient;
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

export function createDossierClientProvider(server: Server): DossierClientProvider {
  return {
    dossierClient(principal, sessionType) {
      const sessionResult = sessionForPrincipal(server, principal, sessionType);
      return server.createDossierClient(() => sessionResult);
    },
  };
}

export function createSharedClientProvider(
  server: Server,
): DossierClientProvider & PublishedClientProvider {
  return {
    dossierClient(principal, sessionType) {
      const sessionResult = sessionForPrincipal(server, principal, sessionType);
      return server.createDossierClient(() => sessionResult);
    },
    publishedClient(principal, sessionType) {
      const sessionResult = sessionForPrincipal(server, principal, sessionType);
      return server.createPublishedClient(() => sessionResult);
    },
  };
}
