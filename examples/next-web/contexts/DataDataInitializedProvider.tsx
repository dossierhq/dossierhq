import { DataDataProvider } from '@jonasb/datadata-admin-react-components';
import { useMemo } from 'react';
import { ContextAdapter, createBackendAdminClient } from './DataDataContext';

export function DataDataInitializedProvider({ children }: { children: React.ReactNode }) {
  const args = useMemo(
    () => ({ adminClient: createBackendAdminClient(), adapter: new ContextAdapter() }),
    []
  );
  return <DataDataProvider {...args}> {children} </DataDataProvider>;
}
