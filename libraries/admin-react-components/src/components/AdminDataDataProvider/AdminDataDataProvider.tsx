import type { AdminClient, Logger } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import React, { useMemo } from 'react';
import type { AdminDataDataContextAdapter, AdminDataDataContextValue, DisplayAuthKey } from '../..';
import { AdminDataDataContext, useAdminSchema } from '../..';

interface Props {
  adapter: AdminDataDataContextAdapter;
  adminClient: AdminClient;
  logger?: Logger;
  authKeys: DisplayAuthKey[];
  children: React.ReactNode;
}

export function AdminDataDataProvider({
  adapter,
  adminClient,
  logger,
  authKeys,
  children,
}: Props): JSX.Element | null {
  const { schema, schemaError } = useAdminSchema(adminClient);
  const value: AdminDataDataContextValue = useMemo(() => {
    return {
      adapter,
      adminClient,
      logger: logger ?? NoOpLogger,
      schema,
      schemaError,
      authKeys,
    };
  }, [adapter, adminClient, logger, schema, schemaError, authKeys]);

  return <AdminDataDataContext.Provider value={value}>{children}</AdminDataDataContext.Provider>;
}
