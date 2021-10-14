import type { Logger, PublishedClient } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import React, { useMemo } from 'react';
import type { PublishedDataDataContextValue } from '../../index.js';
import { PublishedDataDataContext, useSchema } from '../../index.js';

interface Props {
  publishedClient: PublishedClient;
  logger?: Logger;
  children: React.ReactNode;
}

export function PublishedDataDataProvider({
  publishedClient,
  logger,
  children,
}: Props): JSX.Element | null {
  const { schema, schemaError } = useSchema(publishedClient);
  const value: PublishedDataDataContextValue = useMemo(() => {
    return {
      publishedClient,
      logger: logger ?? NoOpLogger,
      schema,
      schemaError,
    };
  }, [publishedClient, logger, schema, schemaError]);

  return (
    <PublishedDataDataContext.Provider value={value}>{children}</PublishedDataDataContext.Provider>
  );
}
