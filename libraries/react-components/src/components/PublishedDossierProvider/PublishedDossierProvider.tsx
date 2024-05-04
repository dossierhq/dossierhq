import {
  NoOpLogger,
  type Component,
  type Logger,
  type PublishedDossierClient,
  type PublishedEntity,
} from '@dossierhq/core';
import { useMemo, type ReactNode } from 'react';
import {
  PublishedDossierContext,
  type PublishedDossierContextAdapter,
  type PublishedDossierContextValue,
} from '../../contexts/PublishedDossierContext.js';
import { usePublishedSchema } from '../../hooks/usePublishedSchema.js';
import type { DisplayAuthKey } from '../../types/DisplayAuthKey.js';

interface Props {
  adapter: PublishedDossierContextAdapter;
  publishedClient: PublishedDossierClient<
    PublishedEntity<string, object>,
    Component<string, object>
  >;
  authKeys?: DisplayAuthKey[];
  logger?: Logger;
  children: ReactNode;
}

export function PublishedDossierProvider({
  adapter,
  publishedClient,
  authKeys,
  logger,
  children,
}: Props): JSX.Element | null {
  const { schema, schemaError } = usePublishedSchema(publishedClient);
  const value: PublishedDossierContextValue = useMemo(() => {
    return {
      adapter,
      publishedClient,
      authKeys: authKeys ?? [{ authKey: '', displayName: 'Default' }],
      logger: logger ?? NoOpLogger,
      schema,
      schemaError,
    };
  }, [adapter, publishedClient, authKeys, logger, schema, schemaError]);

  return (
    <PublishedDossierContext.Provider value={value}>{children}</PublishedDossierContext.Provider>
  );
}
