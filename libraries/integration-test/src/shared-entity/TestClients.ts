import type { Server } from '@dossierhq/server';
import type { AppDossierClient, AppPublishedDossierClient } from '../SchemaTypes.js';

export type TestPrincipal = 'main' | 'secondary' | 'random';

export interface DossierClientProvider {
  dossierClient: (
    principal?: TestPrincipal,
    sessionType?: 'readonly' | 'write',
  ) => AppDossierClient;
}

export interface PublishedDossierClientProvider {
  publishedClient: (
    principal?: TestPrincipal,
    sessionType?: 'readonly' | 'write',
  ) => AppPublishedDossierClient;
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

export function createSharedDossierClientProvider(
  server: Server,
): DossierClientProvider & PublishedDossierClientProvider {
  return {
    dossierClient(principal, sessionType) {
      const sessionResult = sessionForPrincipal(server, principal, sessionType);
      return server.createDossierClient(() => sessionResult);
    },
    publishedClient(principal, sessionType) {
      const sessionResult = sessionForPrincipal(server, principal, sessionType);
      return server.createPublishedDossierClient(() => sessionResult);
    },
  };
}
