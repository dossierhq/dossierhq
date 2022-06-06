import type { Logger, PublishedClient } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import React, { useMemo } from 'react';
import type { DisplayAuthKey } from '../../../';
import type { PublishedDataDataContextValue } from '../../contexts/PublishedDataDataContext.js';
import { PublishedDataDataContext } from '../../contexts/PublishedDataDataContext.js';
import { usePublishedSchema } from '../../hooks/usePublishedSchema.js';

interface Props {
  publishedClient: PublishedClient;
  authKeys: DisplayAuthKey[];
  logger?: Logger;
  children: React.ReactNode;
}

export function PublishedDataDataProvider({
  publishedClient,
  authKeys,
  logger,
  children,
}: Props): JSX.Element | null {
  const { schema, schemaError } = usePublishedSchema(publishedClient);
  const value: PublishedDataDataContextValue = useMemo(() => {
    return {
      publishedClient,
      authKeys,
      logger: logger ?? NoOpLogger,
      schema,
      schemaError,
    };
  }, [publishedClient, authKeys, logger, schema, schemaError]);

  return (
    <PublishedDataDataContext.Provider value={value}>{children}</PublishedDataDataContext.Provider>
  );
}
