import type { AdminClient, Entity, Component, Logger } from '@dossierhq/core';
import { NoOpLogger } from '@dossierhq/core';
import { useMemo, type ReactNode } from 'react';
import type {
  AdminDossierContextAdapter,
  AdminDossierContextValue,
} from '../../contexts/AdminDossierContext.js';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import { useAdminSchema } from '../../hooks/useAdminSchema.js';
import type { DisplayAuthKey } from '../../types/DisplayAuthKey.js';

interface Props {
  adapter: AdminDossierContextAdapter;
  adminClient: AdminClient<Entity<string, object>, Component<string, object>>;
  logger?: Logger;
  authKeys?: DisplayAuthKey[];
  children: ReactNode;
}

export function AdminDossierProvider({
  adapter,
  adminClient,
  logger,
  authKeys,
  children,
}: Props): JSX.Element | null {
  const { schema, schemaError } = useAdminSchema(adminClient);
  const value: AdminDossierContextValue = useMemo(() => {
    return {
      adapter,
      adminClient,
      logger: logger ?? NoOpLogger,
      schema,
      schemaError,
      authKeys: authKeys ?? [{ authKey: '', displayName: 'Default' }],
    };
  }, [adapter, adminClient, logger, schema, schemaError, authKeys]);

  return <AdminDossierContext.Provider value={value}>{children}</AdminDossierContext.Provider>;
}
