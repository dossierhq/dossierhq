import type { ClientContext, PublishedClientMiddleware } from '@jonasb/datadata-core';
import React, { useMemo } from 'react';
import { createBackendPublishedClient, DISPLAY_AUTH_KEYS } from '../../test/TestContextAdapter';
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

  return (
    <PublishedDataDataProvider publishedClient={publishedClient} authKeys={DISPLAY_AUTH_KEYS}>
      {children}
    </PublishedDataDataProvider>
  );
}
