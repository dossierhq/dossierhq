'use client';

import {
  NoOpLogger,
  type Component,
  type Logger,
  type PublishedDossierClient,
  type PublishedEntity,
} from '@dossierhq/core';
import { useMemo, type JSX, type ReactNode } from 'react';
import {
  PublishedDossierContext,
  type PublishedDossierContextAdapter,
  type PublishedDossierContextValue,
} from '../contexts/PublishedDossierContext.js';

interface Props {
  publishedClient: PublishedDossierClient<
    PublishedEntity<string, object>,
    Component<string, object>
  >;
  logger?: Logger;
  adapter?: PublishedDossierContextAdapter;
  children: ReactNode;
}

export function PublishedDossierProvider({
  publishedClient,
  logger,
  adapter,
  children,
}: Props): JSX.Element | null {
  const value: PublishedDossierContextValue = useMemo(() => {
    return {
      publishedClient,
      logger: logger ?? NoOpLogger,
      adapter: adapter ?? null,
    };
  }, [publishedClient, logger, adapter]);

  return (
    <PublishedDossierContext.Provider value={value}>{children}</PublishedDossierContext.Provider>
  );
}
