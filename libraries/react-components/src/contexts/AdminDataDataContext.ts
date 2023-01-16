import type {
  AdminClient,
  AdminEntity,
  AdminSchema,
  ErrorResult,
  ErrorType,
  Logger,
  ValueItem,
} from '@dossierhq/core';
import { createContext } from 'react';
import type { FieldEditorProps } from '../components/EntityEditor/FieldEditor.js';
import type { DisplayAuthKey } from '../shared/types/DisplayAuthKey.js';

export interface RichTextValueItemEditorProps {
  value: ValueItem;
  onChange: (value: ValueItem<string, object>) => void;
}

export interface AdminDataDataContextAdapter {
  renderAdminFieldEditor(props: FieldEditorProps): JSX.Element | null;
  renderAdminRichTextValueItemEditor(props: RichTextValueItemEditorProps): JSX.Element | null;
}

export interface AdminDataDataContextValue {
  adapter: AdminDataDataContextAdapter;
  adminClient: AdminClient<AdminEntity<string, object>>;
  logger: Logger;
  schema: AdminSchema | undefined;
  schemaError: ErrorResult<unknown, typeof ErrorType.Generic> | undefined;
  authKeys: DisplayAuthKey[];
}

export const AdminDataDataContext = createContext<AdminDataDataContextValue>({
  placeholderContextValue: true,
} as unknown as AdminDataDataContextValue);
AdminDataDataContext.displayName = 'AdminDataDataContext';
