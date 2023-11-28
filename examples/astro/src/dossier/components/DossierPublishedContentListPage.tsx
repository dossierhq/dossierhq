import type { PublishedEntity } from '@dossierhq/core';
import { NotificationContainer } from '@dossierhq/design';
import { PublishedEntityListScreen } from '@dossierhq/react-components';
import { useUrlSearchParams } from '../hooks/useUrlSearchParams.js';
import { AppPublishedDossierProvider } from './AppPublishedDossierProvider.js';
import { NavBar } from './NavBar.js';

export function DossierPublishedContentListPage() {
  const [urlSearchParams, setSearchParams] = useUrlSearchParams();
  return (
    <AppPublishedDossierProvider>
      <NotificationContainer>
        <PublishedEntityListScreen
          header={<NavBar current="published-content" />}
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setSearchParams}
          onOpenEntity={handleEntityOpen}
        />
      </NotificationContainer>
    </AppPublishedDossierProvider>
  );
}

function handleEntityOpen(entity: PublishedEntity) {
  window.location.assign(`/dossier/published-content/display?id=${entity.id}`);
}
