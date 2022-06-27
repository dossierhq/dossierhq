import type {
  AdminClient,
  AdminSchema,
  ErrorResult,
  ErrorType,
  Logger,
} from '@jonasb/datadata-core';
import { createContext } from 'react';
import type { DisplayAuthKey } from '../shared/types/DisplayAuthKey.js';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AdminDataDataContextAdapter {}

export interface AdminDataDataContextValue {
  adapter: AdminDataDataContextAdapter;
  adminClient: AdminClient;
  logger: Logger;
  schema: AdminSchema | undefined;
  schemaError: ErrorResult<unknown, typeof ErrorType.Generic> | undefined;
  authKeys: DisplayAuthKey[];
}

export const AdminDataDataContext = createContext<AdminDataDataContextValue>({
  placeholderContextValue: true,
} as unknown as AdminDataDataContextValue);
AdminDataDataContext.displayName = 'AdminDataDataContext';
