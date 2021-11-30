import type { AdminClient, Logger } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import React, { useContext, useMemo } from 'react';
import type { DataDataContextAdapter, DataDataContextValue2, DisplayAuthKey } from '../../index.js';
import { DataDataContext, DataDataContext2, DataDataContextValue, useSchema } from '../../index.js';

interface Props {
  adapter: DataDataContextAdapter;
  adminClient: AdminClient;
  logger?: Logger;
  authKeys: DisplayAuthKey[];
  children: React.ReactNode;
}

export function DataDataProvider({
  adapter,
  adminClient,
  logger,
  authKeys,
  children,
}: Props): JSX.Element | null {
  const { schema, schemaError } = useSchema(adminClient);
  const value = useMemo(
    () =>
      schema
        ? new DataDataContextValue(adapter, adminClient, schema, logger ?? NoOpLogger, authKeys)
        : null,
    [adapter, adminClient, schema, authKeys, logger]
  );
  const value2: DataDataContextValue2 = useMemo(() => {
    return {
      adapter,
      adminClient,
      logger: logger ?? NoOpLogger,
      schema,
      schemaError,
      authKeys,
    };
  }, [adapter, adminClient, logger, schema, schemaError, authKeys]);

  return (
    <DataDataContext2.Provider value={value2}>
      {value ? (
        <DataDataContext.Provider value={value}>{children}</DataDataContext.Provider>
      ) : (
        children
      )}
    </DataDataContext2.Provider>
  );
}

//TODO remove when migrated to DataDataContext2
export function WaitForDataDataContext({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element | null {
  const context = useContext(DataDataContext);
  if ('defaultContextValue' in context) return null;
  return <>{children}</>;
}
