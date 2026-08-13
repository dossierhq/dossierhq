import {
  addContentDisplayParamsToURLSearchParams,
  PublishedContentListScreen,
  ThemeProvider,
} from '@dossierhq/react-components2';
import { useCallback } from 'react';
import { useUrlSearchParams } from '../hooks/useUrlSearchParams.js';
import { AppPublishedDossierProvider } from './AppPublishedDossierProvider.js';
import { NavBar } from './NavBar.js';

export function DossierPublishedContentListPage() {
  const [urlSearchParams, setSearchParams] = useUrlSearchParams();

  const handleOpenEntity = useCallback((id: string) => {
    const displayUrlSearchParams = new URLSearchParams();
    addContentDisplayParamsToURLSearchParams(displayUrlSearchParams, { entityIds: [id] });
    window.location.assign(
      `/dossier/published-content/display?${displayUrlSearchParams.toString()}`,
    );
  }, []);

  return (
    <ThemeProvider>
      <AppPublishedDossierProvider>
        <PublishedContentListScreen
          header={<NavBar current="published-content" />}
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setSearchParams}
          onOpenEntity={handleOpenEntity}
        />
      </AppPublishedDossierProvider>
    </ThemeProvider>
  );
}
