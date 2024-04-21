import type {
  AdminClient,
  Entity,
  Schema,
  Component,
  ErrorResult,
  ErrorType,
  Logger,
  PublishValidationIssue,
  SaveValidationIssue,
} from '@dossierhq/core';
import { createContext } from 'react';
import type { FieldEditorProps } from '../components/EntityEditor/FieldEditor.js';
import type { DisplayAuthKey } from '../types/DisplayAuthKey.js';

export interface RichTextComponentEditorProps {
  value: Component;
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
  onChange: (value: Component<string, object>) => void;
}

export interface AdminDossierContextAdapter {
  renderAdminFieldEditor(props: FieldEditorProps): JSX.Element | null;
  renderAdminRichTextComponentEditor(props: RichTextComponentEditorProps): JSX.Element | null;
}

export interface AdminDossierContextValue {
  adapter: AdminDossierContextAdapter;
  adminClient: AdminClient<Entity<string, object>, Component<string, object>>;
  logger: Logger;
  schema: Schema | undefined;
  schemaError: ErrorResult<unknown, typeof ErrorType.Generic> | undefined;
  authKeys: DisplayAuthKey[];
}

export const AdminDossierContext = createContext<AdminDossierContextValue>({
  placeholderContextValue: true,
} as unknown as AdminDossierContextValue);
AdminDossierContext.displayName = 'AdminDossierContext';
