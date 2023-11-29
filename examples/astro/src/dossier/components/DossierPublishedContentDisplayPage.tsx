import { NotificationContainer } from '@dossierhq/design';
import { PublishedContentDisplayScreen } from '@dossierhq/react-components';
import { useUrlSearchParams } from '../hooks/useUrlSearchParams.js';
import { AppPublishedDossierProvider } from './AppPublishedDossierProvider.js';
import { NavBar } from './NavBar.js';

export function DossierPublishedContentDisplayPage() {
  const [urlSearchParams, setSearchParams] = useUrlSearchParams();
  return (
    <AppPublishedDossierProvider>
      <NotificationContainer>
        <PublishedContentDisplayScreen
          header={<NavBar current="published-content" />}
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setSearchParams}
        />
      </NotificationContainer>
    </AppPublishedDossierProvider>
  );
}
