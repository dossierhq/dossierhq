import { createContext } from 'react';

/**
 * Controls whether display components (EntityDisplay, FieldDisplay and friends) read data
 * through the full DossierClient or the published PublishedDossierClient.
 */
export const DisplayModeContext = createContext<'full' | 'published'>('full');
DisplayModeContext.displayName = 'DisplayModeContext';
