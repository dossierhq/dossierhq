import type { AdminClientMiddleware, ClientContext } from '@dossierhq/core';
import { useMemo, type ReactNode } from 'react';
import { AdminDossierProvider } from '../components/AdminDossierProvider/AdminDossierProvider.js';
import type { AdminDossierContextAdapter } from '../contexts/AdminDossierContext.js';
import { useCachingAdminMiddleware } from '../utils/CachingAdminMiddleware.js';
import {
  DISPLAY_AUTH_KEYS,
  TestContextAdapter,
  createBackendAdminClient,
} from './TestContextAdapter.js';

interface Props {
  adapter?: AdminDossierContextAdapter;
  adminClientMiddleware?: AdminClientMiddleware<ClientContext>[];
  children: ReactNode;
}

export function AdminLoadContextProvider({
  adapter,
  adminClientMiddleware,
  children,
}: Props): JSX.Element | null {
  const cachingMiddleware = useCachingAdminMiddleware();

  const adminClient = useMemo(
    () => createBackendAdminClient([...(adminClientMiddleware ?? []), cachingMiddleware]),
    [adminClientMiddleware, cachingMiddleware],
  );

  return (
    <AdminDossierProvider
      adapter={adapter || new TestContextAdapter()}
      adminClient={adminClient}
      authKeys={DISPLAY_AUTH_KEYS}
    >
      {children}
    </AdminDossierProvider>
  );
}
