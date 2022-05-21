import type { AdminClientMiddleware, ClientContext } from '@jonasb/datadata-core';
import React, { useMemo, useRef } from 'react';
import { useSWRConfig } from 'swr';
import type { AdminDataDataContextAdapter } from '..';
import { AdminDataDataProvider } from '../components/AdminDataDataProvider/AdminDataDataProvider';
import {
  createBackendAdminClient,
  DISPLAY_AUTH_KEYS,
  TestContextAdapter,
} from './TestContextAdapter';

interface Props {
  adapter?: AdminDataDataContextAdapter;
  adminClientMiddleware?: AdminClientMiddleware<ClientContext>[];
  children: React.ReactNode;
}

export function AdminLoadContextProvider({
  adapter,
  adminClientMiddleware,
  children,
}: Props): JSX.Element | null {
  const { cache, mutate } = useSWRConfig();
  const swrConfigRef = useRef({ cache, mutate });
  swrConfigRef.current = { cache, mutate };

  const adminClient = useMemo(
    () => createBackendAdminClient(swrConfigRef, adminClientMiddleware),
    [adminClientMiddleware]
  );

  return (
    <AdminDataDataProvider
      adapter={adapter || new TestContextAdapter()}
      adminClient={adminClient}
      authKeys={DISPLAY_AUTH_KEYS}
    >
      {children}
    </AdminDataDataProvider>
  );
}
