import type { ClientContext, DossierClientMiddleware } from '@dossierhq/core';
import { useMemo, type ReactNode } from 'react';
import { AdminDossierProvider } from '../components/AdminDossierProvider/AdminDossierProvider.js';
import type { AdminDossierContextAdapter } from '../contexts/AdminDossierContext.js';
import { useCachingAdminMiddleware } from '../utils/CachingAdminMiddleware.js';
import {
  createBackendDossierClient,
  DISPLAY_AUTH_KEYS,
  TestContextAdapter,
} from './TestContextAdapter.js';

interface Props {
  adapter?: AdminDossierContextAdapter;
  dossierClientMiddleware?: DossierClientMiddleware<ClientContext>[];
  children: ReactNode;
}

export function AdminLoadContextProvider({
  adapter,
  dossierClientMiddleware,
  children,
}: Props): JSX.Element | null {
  const cachingMiddleware = useCachingAdminMiddleware();

  const client = useMemo(
    () => createBackendDossierClient([...(dossierClientMiddleware ?? []), cachingMiddleware]),
    [dossierClientMiddleware, cachingMiddleware],
  );

  return (
    <AdminDossierProvider
      adapter={adapter || new TestContextAdapter()}
      client={client}
      authKeys={DISPLAY_AUTH_KEYS}
    >
      {children}
    </AdminDossierProvider>
  );
}
