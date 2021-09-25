import type { AdminClient, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import React, { useEffect, useState } from 'react';
import type { DataDataContextAdapter } from '..';
import { DataDataProvider } from '..';
import { createBackendAdminClient, TestContextAdapter } from './TestContextAdapter';

interface Props {
  adapter?: DataDataContextAdapter;
  adminClient?: () => PromiseResult<AdminClient, ErrorType>;
  children: React.ReactNode;
}

export function LoadContextProvider({ adapter, adminClient, children }: Props): JSX.Element | null {
  const [isError, setError] = useState(false);
  const [resolvedAdminClient, setResolvedAdminClient] = useState<AdminClient | null>(null);
  useEffect(() => {
    (async () => {
      const result = await (adminClient ? adminClient() : ok(createBackendAdminClient()));
      if (result.isError()) {
        setError(true);
        return;
      }
      setResolvedAdminClient(result.value);
    })();
  }, [adminClient]);

  if (isError) {
    return <h1>Failed initializing</h1>;
  }
  if (!resolvedAdminClient) return null;
  return (
    <DataDataProvider
      adapter={adapter || new TestContextAdapter()}
      adminClient={resolvedAdminClient}
    >
      {children}
    </DataDataProvider>
  );
}
