import type { ClientContext, PublishedClientMiddleware } from '@dossierhq/core';
import React, { useMemo } from 'react';
import {
  createBackendPublishedClient,
  DISPLAY_AUTH_KEYS,
  TestContextAdapter,
} from '../../test/TestContextAdapter';
import { PublishedDataDataProvider } from '../components/PublishedDataDataProvider/PublishedDataDataProvider.js';

interface Props {
  publishedClientMiddleware?: PublishedClientMiddleware<ClientContext>[];
  children: React.ReactNode;
}

export function PublishedLoadContextProvider({
  publishedClientMiddleware,
  children,
}: Props): JSX.Element | null {
  const publishedClient = useMemo(
    () => createBackendPublishedClient(publishedClientMiddleware),
    [publishedClientMiddleware]
  );
  const adapter = useMemo(() => new TestContextAdapter(), []);

  return (
    <PublishedDataDataProvider
      adapter={adapter}
      publishedClient={publishedClient}
      authKeys={DISPLAY_AUTH_KEYS}
    >
      {children}
    </PublishedDataDataProvider>
  );
}
