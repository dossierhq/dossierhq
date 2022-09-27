import type {
  AdminClient,
  AdminSchema,
  ErrorResult,
  ErrorType,
  Logger,
} from '@jonasb/datadata-core';
import { createContext } from 'react';
import type { FieldEditorProps } from '../components/EntityEditor/FieldEditor.js';
import type { DisplayAuthKey } from '../shared/types/DisplayAuthKey.js';

export interface AdminDataDataContextAdapter {
  renderFieldEditor(props: FieldEditorProps<unknown>): JSX.Element | null;
}

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
