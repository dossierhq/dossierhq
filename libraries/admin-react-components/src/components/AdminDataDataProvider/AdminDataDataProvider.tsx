import type { AdminClient, Logger } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import React, { useMemo } from 'react';
import type {
  AdminDataDataContextAdapter,
  AdminDataDataContextValue,
} from '../../contexts/AdminDataDataContext.js';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext.js';
import { useAdminSchema } from '../../hooks/useAdminSchema.js';
import type { DisplayAuthKey } from '../../shared/types/DisplayAuthKey.js';

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
