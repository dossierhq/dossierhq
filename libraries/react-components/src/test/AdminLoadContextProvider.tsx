import type { AdminClientMiddleware, ClientContext } from '@dossierhq/core';
import React, { useMemo } from 'react';
import { AdminDossierProvider } from '../components/AdminDossierProvider/AdminDossierProvider.js';
import type { AdminDossierContextAdapter } from '../contexts/AdminDossierContext.js';
import { useCachingAdminMiddleware } from '../utils/CachingAdminMiddleware.js';
import {
  createBackendAdminClient,
  DISPLAY_AUTH_KEYS,
  TestContextAdapter,
} from './TestContextAdapter.js';

interface Props {
  adapter?: AdminDossierContextAdapter;
  adminClientMiddleware?: AdminClientMiddleware<ClientContext>[];
  children: React.ReactNode;
}

export function AdminLoadContextProvider({
  adapter,
  adminClientMiddleware,
  children,
}: Props): JSX.Element | null {
  const cachingMiddleware = useCachingAdminMiddleware();

  const adminClient = useMemo(
    () => createBackendAdminClient([...(adminClientMiddleware ?? []), cachingMiddleware]),
    [adminClientMiddleware, cachingMiddleware]
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
