import type {
  AdminClient,
  AdminSchema,
  ErrorResult,
  ErrorType,
  FieldSpecification,
  Logger,
} from '@jonasb/datadata-core';
import { createContext } from 'react';
import type { EditorJsToolSettings } from '..';
import type { DisplayAuthKey } from '../shared/types/DisplayAuthKey.js';

export interface AdminDataDataContextAdapter {
  getEditorJSConfig(
    fieldSpec: FieldSpecification,
    standardBlockTools: { [toolName: string]: EditorJsToolSettings },
    standardInlineTools: string[]
  ): { tools: { [toolName: string]: EditorJsToolSettings }; inlineToolbar: string[] };
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
