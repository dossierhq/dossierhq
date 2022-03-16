import type { Logger, PublishedClient } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import React, { useMemo } from 'react';
import type { DisplayAuthKey, PublishedDataDataContextValue } from '../..';
import { PublishedDataDataContext, useSchema } from '../..';

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
  const { schema, schemaError } = useSchema(publishedClient);
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
