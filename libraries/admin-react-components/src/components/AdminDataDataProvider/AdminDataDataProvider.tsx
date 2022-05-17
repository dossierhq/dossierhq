import type { AdminClient, Logger } from '@jonasb/datadata-core';
import { NoOpLogger } from '@jonasb/datadata-core';
import React, { useContext, useMemo } from 'react';
import type { AdminDataDataContextAdapter, AdminDataDataContextValue, DisplayAuthKey } from '../..';
import { AdminDataDataContext, useAdminSchema } from '../..';
import {
  LegacyDataDataContext,
  LegacyDataDataContextValue,
} from '../../contexts/LegacyDataDataContext';

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
  const value = useMemo(
    () =>
      schema
        ? new LegacyDataDataContextValue(
            adapter,
            adminClient,
            schema,
            logger ?? NoOpLogger,
            authKeys
          )
        : null,
    [adapter, adminClient, schema, authKeys, logger]
  );
  const value2: AdminDataDataContextValue = useMemo(() => {
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
    <AdminDataDataContext.Provider value={value2}>
      {value ? (
        <LegacyDataDataContext.Provider value={value}>{children}</LegacyDataDataContext.Provider>
      ) : (
        children
      )}
    </AdminDataDataContext.Provider>
  );
}

//TODO remove when migrated to AdminDataDataContext
export function WaitForLegacyDataDataContext({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element | null {
  const context = useContext(LegacyDataDataContext);
  if ('defaultContextValue' in context) return null;
  return <>{children}</>;
}
