'use client';

import {
  NoOpLogger,
  type Component,
  type DossierClient,
  type Entity,
  type Logger,
} from '@dossierhq/core';
import { useMemo, type JSX, type ReactNode } from 'react';
import {
  DossierContext,
  type DisplayAuthKey,
  type DossierContextAdapter,
  type DossierContextValue,
} from '../contexts/DossierContext.js';

interface Props {
  client: DossierClient<Entity<string, object>, Component<string, object>>;
  logger?: Logger;
  authKeys?: DisplayAuthKey[];
  adapter?: DossierContextAdapter;
  children: ReactNode;
}

const DEFAULT_AUTH_KEYS: DisplayAuthKey[] = [];

export function DossierProvider({
  client,
  logger,
  authKeys,
  adapter,
  children,
}: Props): JSX.Element | null {
  const value: DossierContextValue = useMemo(() => {
    return {
      client,
      logger: logger ?? NoOpLogger,
      authKeys: authKeys ?? DEFAULT_AUTH_KEYS,
      adapter: adapter ?? null,
    };
  }, [client, logger, authKeys, adapter]);

  return <DossierContext.Provider value={value}>{children}</DossierContext.Provider>;
}
