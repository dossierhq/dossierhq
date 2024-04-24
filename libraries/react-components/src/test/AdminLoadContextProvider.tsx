import type { DossierClientMiddleware, ClientContext } from '@dossierhq/core';
import { useMemo, type ReactNode } from 'react';
import { AdminDossierProvider } from '../components/AdminDossierProvider/AdminDossierProvider.js';
import type { AdminDossierContextAdapter } from '../contexts/AdminDossierContext.js';
import { useCachingAdminMiddleware } from '../utils/CachingAdminMiddleware.js';
import {
  DISPLAY_AUTH_KEYS,
  TestContextAdapter,
  createBackendDossierClient,
} from './TestContextAdapter.js';

interface Props {
  adapter?: AdminDossierContextAdapter;
  adminClientMiddleware?: DossierClientMiddleware<ClientContext>[];
  children: ReactNode;
}

export function AdminLoadContextProvider({
  adapter,
  adminClientMiddleware,
  children,
}: Props): JSX.Element | null {
  const cachingMiddleware = useCachingAdminMiddleware();

  const client = useMemo(
    () => createBackendDossierClient([...(adminClientMiddleware ?? []), cachingMiddleware]),
    [adminClientMiddleware, cachingMiddleware],
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
