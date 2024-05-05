import type {
  Component,
  DossierClient,
  Entity,
  ErrorResult,
  ErrorType,
  Logger,
  PublishValidationIssue,
  SaveValidationIssue,
  Schema,
} from '@dossierhq/core';
import { createContext } from 'react';
import type { FieldEditorProps } from '../components/EntityEditor/FieldEditor.js';
import type { DisplayAuthKey } from '../types/DisplayAuthKey.js';

export interface RichTextComponentEditorProps {
  value: Component;
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
  onChange: (value: Component<string, object>) => void;
}

export interface DossierContextAdapter {
  renderAdminFieldEditor(props: FieldEditorProps): JSX.Element | null;
  renderAdminRichTextComponentEditor(props: RichTextComponentEditorProps): JSX.Element | null;
}

export interface AdminDossierContextValue {
  adapter: DossierContextAdapter;
  client: DossierClient<Entity<string, object>, Component<string, object>>;
  logger: Logger;
  schema: Schema | undefined;
  schemaError: ErrorResult<unknown, typeof ErrorType.Generic> | undefined;
  authKeys: DisplayAuthKey[];
}

export const DossierContext = createContext<AdminDossierContextValue>({
  placeholderContextValue: true,
} as unknown as AdminDossierContextValue);
DossierContext.displayName = 'DossierContext';
