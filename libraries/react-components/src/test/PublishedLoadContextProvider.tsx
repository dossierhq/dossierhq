import type { ClientContext, PublishedDossierClientMiddleware } from '@dossierhq/core';
import { useMemo, type ReactNode } from 'react';
import { PublishedDossierProvider } from '../components/PublishedDossierProvider/PublishedDossierProvider.js';
import {
  createBackendPublishedClient,
  DISPLAY_AUTH_KEYS,
  TestContextAdapter,
} from './TestContextAdapter';

interface Props {
  publishedClientMiddleware?: PublishedDossierClientMiddleware<ClientContext>[];
  children: ReactNode;
}

export function PublishedLoadContextProvider({
  publishedClientMiddleware,
  children,
}: Props): JSX.Element | null {
  const publishedClient = useMemo(
    () => createBackendPublishedClient(publishedClientMiddleware),
    [publishedClientMiddleware],
  );
  const adapter = useMemo(() => new TestContextAdapter(), []);

  return (
    <PublishedDossierProvider
      adapter={adapter}
      publishedClient={publishedClient}
      authKeys={DISPLAY_AUTH_KEYS}
    >
      {children}
    </PublishedDossierProvider>
  );
}
