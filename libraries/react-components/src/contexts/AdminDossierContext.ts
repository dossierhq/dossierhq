import type {
  AdminClient,
  AdminEntity,
  AdminSchema,
  ErrorResult,
  ErrorType,
  Logger,
  PublishValidationIssue,
  SaveValidationIssue,
  ValueItem,
} from '@dossierhq/core';
import { createContext } from 'react';
import type { FieldEditorProps } from '../components/EntityEditor/FieldEditor.js';
import type { DisplayAuthKey } from '../shared/types/DisplayAuthKey.js';

export interface RichTextValueItemEditorProps {
  value: ValueItem;
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
  onChange: (value: ValueItem<string, object>) => void;
}

export interface AdminDossierContextAdapter {
  renderAdminFieldEditor(props: FieldEditorProps): JSX.Element | null;
  renderAdminRichTextValueItemEditor(props: RichTextValueItemEditorProps): JSX.Element | null;
}

export interface AdminDossierContextValue {
  adapter: AdminDossierContextAdapter;
  adminClient: AdminClient<AdminEntity<string, object>, ValueItem<string, object>>;
  logger: Logger;
  schema: AdminSchema | undefined;
  schemaError: ErrorResult<unknown, typeof ErrorType.Generic> | undefined;
  authKeys: DisplayAuthKey[];
}

export const AdminDossierContext = createContext<AdminDossierContextValue>({
  placeholderContextValue: true,
} as unknown as AdminDossierContextValue);
AdminDossierContext.displayName = 'AdminDossierContext';
