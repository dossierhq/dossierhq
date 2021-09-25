import type { AdminClient, Logger } from '@jonasb/datadata-core';
import React, { useMemo } from 'react';
import type { DataDataContextAdapter, DataDataContextValue2 } from '../..';
import { DataDataContext, DataDataContext2, DataDataContextValue, useSchema } from '../..';

interface Props {
  adapter: DataDataContextAdapter;
  adminClient: AdminClient;
  logger?: Logger;
  children: React.ReactNode;
}

export function DataDataProvider({
  adapter,
  adminClient,
  logger,
  children,
}: Props): JSX.Element | null {
  const { schema, schemaError } = useSchema(adminClient);
  const value = useMemo(
    () => (schema ? new DataDataContextValue(adapter, adminClient, schema) : null),
    [adapter, adminClient, schema]
  );
  const resolvedLogger = useMemo(() => {
    if (logger) return logger;
    const noop = () => {
      // no-op
    };
    return {
      error: noop,
      warn: noop,
      info: noop,
      debug: noop,
    };
  }, [logger]);
  const value2: DataDataContextValue2 = useMemo(() => {
    return { adapter, adminClient, logger: resolvedLogger, schema, schemaError };
  }, [adapter, adminClient, resolvedLogger, schema, schemaError]);

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
