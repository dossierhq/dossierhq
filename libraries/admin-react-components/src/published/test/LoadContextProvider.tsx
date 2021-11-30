import type { ErrorType, PromiseResult, PublishedClient } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import React, { useEffect, useState } from 'react';
import { createBackendPublishedClient, DISPLAY_AUTH_KEYS } from '../../test/TestContextAdapter.js';
import { PublishedDataDataProvider } from '../index.js';

interface Props {
  publishedClient?: () => PromiseResult<PublishedClient, ErrorType>;
  children: React.ReactNode;
}

export function LoadContextProvider({ publishedClient, children }: Props): JSX.Element | null {
  const [isError, setError] = useState(false);
  const [resolvedPublishedClient, setResolvedPublishedClient] = useState<PublishedClient | null>(
    null
  );

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
  if (!resolvedPublishedClient) return null;
  return (
    <PublishedDataDataProvider
      publishedClient={resolvedPublishedClient}
      authKeys={DISPLAY_AUTH_KEYS}
    >
      {children}
    </PublishedDataDataProvider>
  );
}
