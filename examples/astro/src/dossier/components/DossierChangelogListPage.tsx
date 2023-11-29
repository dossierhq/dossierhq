import { NotificationContainer } from '@dossierhq/design';
import { ChangelogListScreen } from '@dossierhq/react-components';
import { useUrlSearchParams } from '../hooks/useUrlSearchParams.js';
import { AppAdminDossierProvider } from './AppAdminDossierProvider.js';
import { NavBar } from './NavBar.js';

export function DossierChangelogListPage() {
  const [urlSearchParams, setSearchParams] = useUrlSearchParams();
  return (
    <AppAdminDossierProvider>
      <NotificationContainer>
        <ChangelogListScreen
          header={<NavBar current="changelog" />}
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setSearchParams}
        />
      </NotificationContainer>
    </AppAdminDossierProvider>
  );
}
