import type { AdminClient } from '@jonasb/datadata-core';
import React, { useMemo } from 'react';
import type { DataDataContextAdapter } from '../..';
import { DataDataContext, DataDataContextValue, useSchema } from '../..';

interface Props {
  adapter: DataDataContextAdapter;
  adminClient: AdminClient;
  children: React.ReactNode;
}

export function DataDataProvider({ adapter, adminClient, children }: Props): JSX.Element | null {
  const { schema, schemaError } = useSchema(adminClient);
  const value = useMemo(
    () => (schema ? new DataDataContextValue(adapter, adminClient, schema) : null),
    [adapter, adminClient, schema]
  );
  if (!value) {
    return null;
  }
  return <DataDataContext.Provider value={value}>{children}</DataDataContext.Provider>;
}
