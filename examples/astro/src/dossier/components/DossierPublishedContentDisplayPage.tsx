import { PublishedContentDisplayScreen, ThemeProvider } from '@dossierhq/react-components2';
import { useUrlSearchParams } from '../hooks/useUrlSearchParams.js';
import { AppPublishedDossierProvider } from './AppPublishedDossierProvider.js';
import { NavBar } from './NavBar.js';

export function DossierPublishedContentDisplayPage() {
  const [urlSearchParams, setSearchParams] = useUrlSearchParams();
  return (
    <ThemeProvider>
      <AppPublishedDossierProvider>
        <PublishedContentDisplayScreen
          header={<NavBar current="published-content" />}
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setSearchParams}
        />
      </AppPublishedDossierProvider>
    </ThemeProvider>
  );
}
