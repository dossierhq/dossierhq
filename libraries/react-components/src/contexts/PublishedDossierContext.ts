import type {
  Component,
  ErrorResult,
  ErrorType,
  Logger,
  PublishedClient,
  PublishedEntity,
  PublishedSchema,
} from '@dossierhq/core';
import { createContext } from 'react';
import type { FieldDisplayProps } from '../components/EntityDisplay/FieldDisplay.js';
import type { DisplayAuthKey } from '../shared/types/DisplayAuthKey.js';

export interface RichTextValueItemDisplayProps {
  value: Component;
}

export interface PublishedDossierContextAdapter {
  renderPublishedFieldDisplay(props: FieldDisplayProps): JSX.Element | null;
  renderPublishedRichTextComponentDisplay(props: RichTextValueItemDisplayProps): JSX.Element | null;
}

export interface PublishedDossierContextValue {
  adapter: PublishedDossierContextAdapter;
  publishedClient: PublishedClient<PublishedEntity<string, object>, Component<string, object>>;
  logger: Logger;
  schema: PublishedSchema | undefined;
  schemaError: ErrorResult<unknown, typeof ErrorType.Generic> | undefined;
  authKeys: DisplayAuthKey[];
}

export const PublishedDossierContext = createContext<PublishedDossierContextValue>({
  placeholderContextValue: true,
} as unknown as PublishedDossierContextValue);
PublishedDossierContext.displayName = 'PublishedDossierContext';
