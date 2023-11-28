import { NotificationContainer } from '@dossierhq/design';
import { ChangelogScreen } from '@dossierhq/react-components';
import { AppAdminDossierProvider } from './AppAdminDossierProvider.js';
import { NavBar } from './NavBar.js';
import { useUrlSearchParams } from './useUrlSearchParams.js';

export function DossierChangelogPage() {
  const [urlSearchParams, setSearchParams] = useUrlSearchParams();
  return (
    <AppAdminDossierProvider>
      <NotificationContainer>
        <ChangelogScreen
          header={<NavBar current="changelog" />}
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setSearchParams}
        />
      </NotificationContainer>
    </AppAdminDossierProvider>
  );
}
