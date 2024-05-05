import type { ClientContext, DossierClientMiddleware } from '@dossierhq/core';
import { useMemo, type ReactNode } from 'react';
import { DossierProvider } from '../components/DossierProvider/DossierProvider.js';
import type { DossierContextAdapter } from '../contexts/DossierContext.js';
import { useCachingDossierMiddleware } from '../utils/CachingAdminMiddleware.js';
import {
  createBackendDossierClient,
  DISPLAY_AUTH_KEYS,
  TestContextAdapter,
} from './TestContextAdapter.js';

interface Props {
  adapter?: DossierContextAdapter;
  dossierClientMiddleware?: DossierClientMiddleware<ClientContext>[];
  children: ReactNode;
}

export function AdminLoadContextProvider({
  adapter,
  dossierClientMiddleware,
  children,
}: Props): JSX.Element | null {
  const cachingMiddleware = useCachingDossierMiddleware();

  const client = useMemo(
    () => createBackendDossierClient([...(dossierClientMiddleware ?? []), cachingMiddleware]),
    [dossierClientMiddleware, cachingMiddleware],
  );

  return (
    <DossierProvider
      adapter={adapter || new TestContextAdapter()}
      client={client}
      authKeys={DISPLAY_AUTH_KEYS}
    >
      {children}
    </DossierProvider>
  );
}
