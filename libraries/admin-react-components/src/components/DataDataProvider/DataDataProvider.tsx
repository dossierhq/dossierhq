import type { AdminClient } from '@jonasb/datadata-core';
import React, { useMemo } from 'react';
import type { DataDataContextAdapter, DataDataContextValue2 } from '../..';
import { DataDataContext, DataDataContext2, DataDataContextValue, useSchema } from '../..';

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
  const value2: DataDataContextValue2 = useMemo(
    () => ({ adapter, adminClient, schema, schemaError }),
    [adapter, adminClient, schema, schemaError]
  );

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
