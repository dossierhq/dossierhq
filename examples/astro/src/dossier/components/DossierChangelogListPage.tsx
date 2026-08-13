import { ChangelogListScreen, ThemeProvider } from '@dossierhq/react-components2';
import { useUrlSearchParams } from '../hooks/useUrlSearchParams.js';
import { AppAdminDossierProvider } from './AppAdminDossierProvider.js';
import { NavBar } from './NavBar.js';

export function DossierChangelogListPage() {
  const [urlSearchParams, setSearchParams] = useUrlSearchParams();
  return (
    <ThemeProvider>
      <AppAdminDossierProvider>
        <ChangelogListScreen
          header={<NavBar current="changelog" />}
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setSearchParams}
        />
      </AppAdminDossierProvider>
    </ThemeProvider>
  );
}
