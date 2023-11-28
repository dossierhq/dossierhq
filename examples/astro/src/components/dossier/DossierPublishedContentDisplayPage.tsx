import { NotificationContainer } from '@dossierhq/design';
import { PublishedEntityDisplayScreen } from '@dossierhq/react-components';
import { AppPublishedDossierProvider } from './AppPublishedDossierProvider.js';
import { NavBar } from './NavBar.js';
import { useUrlSearchParams } from './useUrlSearchParams.js';

export function DossierPublishedContentDisplayPage() {
  const [urlSearchParams, setSearchParams] = useUrlSearchParams();
  return (
    <AppPublishedDossierProvider>
      <NotificationContainer>
        <PublishedEntityDisplayScreen
          header={<NavBar current="published-content" />}
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setSearchParams}
        />
      </NotificationContainer>
    </AppPublishedDossierProvider>
  );
}
