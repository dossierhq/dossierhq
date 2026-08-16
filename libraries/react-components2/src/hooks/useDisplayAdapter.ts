import { useContext, type ReactNode } from 'react';
import type { FieldDisplayProps } from '../components/FieldDisplay.js';
import { DisplayModeContext } from '../contexts/DisplayModeContext.js';
import {
  DossierContext,
  type DossierContextAdapter,
  type RichTextComponentDisplayProps,
} from '../contexts/DossierContext.js';
import {
  PublishedDossierContext,
  type PublishedDossierContextAdapter,
} from '../contexts/PublishedDossierContext.js';

interface DisplayOverrides {
  renderFieldDisplay: (props: FieldDisplayProps) => ReactNode | null;
  renderRichTextComponentDisplay: (props: RichTextComponentDisplayProps) => ReactNode | null;
}

/**
 * Picks the display overrides for a display mode. In `published` mode they come from
 * `PublishedDossierProvider`, so published-only apps don't need a `DossierProvider` (which
 * they can't create, having no full client).
 */
export function resolveDisplayOverrides(
  mode: 'full' | 'published',
  fullAdapter: DossierContextAdapter | null | undefined,
  publishedAdapter: PublishedDossierContextAdapter | null | undefined,
): DisplayOverrides {
  if (mode === 'published') {
    return {
      renderFieldDisplay: (props) => publishedAdapter?.renderPublishedFieldDisplay(props) ?? null,
      renderRichTextComponentDisplay: (props) =>
        publishedAdapter?.renderPublishedRichTextComponentDisplay?.(props) ?? null,
    };
  }
  return {
    renderFieldDisplay: (props) => fullAdapter?.renderFieldDisplay?.(props) ?? null,
    renderRichTextComponentDisplay: (props) =>
      fullAdapter?.renderRichTextComponentDisplay?.(props) ?? null,
  };
}

/** Display overrides for the current display mode. */
export function useDisplayAdapter(): DisplayOverrides {
  const mode = useContext(DisplayModeContext);
  const { adapter: fullAdapter } = useContext(DossierContext);
  const { adapter: publishedAdapter } = useContext(PublishedDossierContext);

  return resolveDisplayOverrides(mode, fullAdapter, publishedAdapter);
}
