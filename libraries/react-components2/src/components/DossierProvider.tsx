import { DossierContext, type DossierContextValue } from '@/contexts/DossierContext.js';
import {
  NoOpLogger,
  type Component,
  type DossierClient,
  type Entity,
  type Logger,
} from '@dossierhq/core';
import { useMemo, type ReactNode } from 'react';

interface Props {
  client: DossierClient<Entity<string, object>, Component<string, object>>;
  logger?: Logger;
  children: ReactNode;
}

export function DossierProvider({ client, logger, children }: Props): JSX.Element | null {
  const value: DossierContextValue = useMemo(() => {
    return {
      client,
      logger: logger ?? NoOpLogger,
    };
  }, [client, logger]);

  return <DossierContext.Provider value={value}>{children}</DossierContext.Provider>;
}
