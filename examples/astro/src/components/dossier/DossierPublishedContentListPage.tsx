import type { PublishedEntity } from '@dossierhq/core';
import { NotificationContainer } from '@dossierhq/design';
import { PublishedEntityListScreen } from '@dossierhq/react-components';
import { AppPublishedDossierProvider } from './AppPublishedDossierProvider.js';
import { NavBar } from './NavBar.js';
import { useUrlSearchParams } from './useUrlSearchParams.js';

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
