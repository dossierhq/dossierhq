import type { AdminClient, ErrorType, PromiseResult, PublishedClient } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import React, { useEffect, useState } from 'react';
import type { DataDataContextAdapter } from '..';
import { DataDataProvider } from '..';
import {
  createBackendAdminClient,
  createBackendPublishedClient,
  TestContextAdapter,
} from './TestContextAdapter.js';

interface Props {
  adapter?: DataDataContextAdapter;
  adminClient?: () => PromiseResult<AdminClient, ErrorType>;
  publishedClient?: () => PromiseResult<PublishedClient, ErrorType>;
  children: React.ReactNode;
}

export function LoadContextProvider({
  adapter,
  adminClient,
  publishedClient,
  children,
}: Props): JSX.Element | null {
  const [isError, setError] = useState(false);
  const [resolvedAdminClient, setResolvedAdminClient] = useState<AdminClient | null>(null);
  const [resolvedPublishedClient, setResolvedPublishedClient] = useState<PublishedClient | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const result = await (adminClient ? adminClient() : ok(createBackendAdminClient()));
      if (result.isError()) {
        setError(true);
        return;
      }
      setResolvedAdminClient(result.value);
    })();
  }, [adminClient]);

  useEffect(() => {
    (async () => {
      const result = await (publishedClient
        ? publishedClient()
        : ok(createBackendPublishedClient()));
      if (result.isError()) {
        setError(true);
        return;
      }
      setResolvedPublishedClient(result.value);
    })();
  }, [publishedClient]);

  if (isError) {
    return <h1>Failed initializing</h1>;
  }
  if (!resolvedAdminClient || !resolvedPublishedClient) return null;
  return (
    <DataDataProvider
      adapter={adapter || new TestContextAdapter()}
      adminClient={resolvedAdminClient}
      publishedClient={resolvedPublishedClient}
    >
      {children}
    </DataDataProvider>
  );
}
