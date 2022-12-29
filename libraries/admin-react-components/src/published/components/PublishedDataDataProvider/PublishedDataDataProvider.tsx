import type { Logger, PublishedClient, PublishedEntity } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import React, { useMemo } from 'react';
import type { DisplayAuthKey } from '../../../shared/types/DisplayAuthKey.js';
import type {
  PublishedDataDataContextAdapter,
  PublishedDataDataContextValue,
} from '../../contexts/PublishedDataDataContext.js';
import { PublishedDataDataContext } from '../../contexts/PublishedDataDataContext.js';
import { usePublishedSchema } from '../../hooks/usePublishedSchema.js';

interface Props {
  adapter: PublishedDataDataContextAdapter;
  publishedClient: PublishedClient<PublishedEntity<string, object>>;
  authKeys: DisplayAuthKey[];
  logger?: Logger;
  children: React.ReactNode;
}

export function PublishedDataDataProvider({
  adapter,
  publishedClient,
  authKeys,
  logger,
  children,
}: Props): JSX.Element | null {
  const { schema, schemaError } = usePublishedSchema(publishedClient);
  const value: PublishedDataDataContextValue = useMemo(() => {
    return {
      adapter,
      publishedClient,
      authKeys,
      logger: logger ?? NoOpLogger,
      schema,
      schemaError,
    };
  }, [adapter, publishedClient, authKeys, logger, schema, schemaError]);

  return (
    <PublishedDataDataContext.Provider value={value}>{children}</PublishedDataDataContext.Provider>
  );
}
