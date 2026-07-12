import type {
  Component,
  DossierClient,
  Entity,
  Logger,
  PublishValidationIssue,
  SaveValidationIssue,
} from '@dossierhq/core';
import { createContext, type ReactNode } from 'react';
import type { FieldDisplayProps } from '../components/FieldDisplay.js';
import type { FieldEditorProps } from '../components/FieldEditor.js';

export interface DisplayAuthKey {
  authKey: string;
  displayName: string;
}

export interface RichTextComponentEditorProps {
  value: Component;
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
  onChange: (value: Component<string, object>) => void;
}

export interface RichTextComponentDisplayProps {
  value: Component;
}

export interface DossierContextAdapter {
  /** Return null to fall back to the built-in editor. */
  renderFieldEditor(props: FieldEditorProps): ReactNode | null;
  /** Return null to fall back to the built-in display. */
  renderFieldDisplay(props: FieldDisplayProps): ReactNode | null;
  /** Return null to fall back to the built-in editor. */
  renderRichTextComponentEditor?(props: RichTextComponentEditorProps): ReactNode | null;
  /** Return null to fall back to the built-in display. */
  renderRichTextComponentDisplay?(props: RichTextComponentDisplayProps): ReactNode | null;
}

export interface DossierContextValue {
  client: DossierClient<Entity<string, object>, Component<string, object>>;
  logger: Logger;
  authKeys: DisplayAuthKey[];
  adapter: DossierContextAdapter | null;
}

export const DossierContext = createContext<DossierContextValue>({
  placeholderContextValue: true,
} as unknown as DossierContextValue);
DossierContext.displayName = 'DossierContext';
