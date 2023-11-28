import { NotificationContainer } from '@dossierhq/design';
import { ChangelogScreen } from '@dossierhq/react-components';
import { useUrlSearchParams } from '../hooks/useUrlSearchParams.js';
import { AppAdminDossierProvider } from './AppAdminDossierProvider.js';
import { NavBar } from './NavBar.jsx';

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
