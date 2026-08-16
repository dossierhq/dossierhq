import type { Component, Logger, PublishedDossierClient, PublishedEntity } from '@dossierhq/core';
import { createContext, type ReactNode } from 'react';
import type { FieldDisplayProps } from '../components/FieldDisplay.js';
import type { RichTextComponentDisplayProps } from './DossierContext.js';

export interface PublishedDossierContextAdapter {
  /** Return null to fall back to the built-in display. */
  renderPublishedFieldDisplay(props: FieldDisplayProps): ReactNode | null;
  /** Return null to fall back to the built-in display. */
  renderPublishedRichTextComponentDisplay?(props: RichTextComponentDisplayProps): ReactNode | null;
}

export interface PublishedDossierContextValue {
  publishedClient: PublishedDossierClient<
    PublishedEntity<string, object>,
    Component<string, object>
  >;
  logger: Logger;
  adapter: PublishedDossierContextAdapter | null;
}

export const PublishedDossierContext = createContext<PublishedDossierContextValue>({
  placeholderContextValue: true,
} as unknown as PublishedDossierContextValue);
PublishedDossierContext.displayName = 'PublishedDossierContext';
