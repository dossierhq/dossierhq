import {
  NoOpLogger,
  type Component,
  type DossierClient,
  type Entity,
  type Logger,
} from '@dossierhq/core';
import { useMemo, type ReactNode } from 'react';
import { DossierContext, type DossierContextValue } from '../contexts/DossierContext.js';
import { useSchema } from '../hooks/useSchema.js';

interface Props {
  client: DossierClient<Entity<string, object>, Component<string, object>>;
  logger?: Logger;
  children: ReactNode;
}

export function DossierProvider({ client, logger, children }: Props): JSX.Element | null {
  const { schema, schemaError } = useSchema(client);
  const value: DossierContextValue = useMemo(() => {
    return {
      client,
      logger: logger ?? NoOpLogger,
      schema,
      schemaError,
    };
  }, [client, logger, schema, schemaError]);

  return <DossierContext.Provider value={value}>{children}</DossierContext.Provider>;
}
