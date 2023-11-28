import type { AdminEntity } from '@dossierhq/core';
import { NotificationContainer } from '@dossierhq/design';
import { AdminEntityListScreen } from '@dossierhq/react-components';
import { useUrlSearchParams } from '../hooks/useUrlSearchParams.js';
import { AppAdminDossierProvider } from './AppAdminDossierProvider.js';
import { NavBar } from './NavBar.js';

export function DossierContentListPage() {
  const [urlSearchParams, setSearchParams] = useUrlSearchParams();
  return (
    <AppAdminDossierProvider>
      <NotificationContainer>
        <AdminEntityListScreen
          header={<NavBar current="content" />}
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setSearchParams}
          onOpenEntity={handleEntityOpen}
          onCreateEntity={handleCreateEntity}
        />
      </NotificationContainer>
    </AppAdminDossierProvider>
  );
}

function handleCreateEntity(type: string) {
  window.location.assign(`/dossier/content/edit?new=${type}:${crypto.randomUUID()}`);
}

function handleEntityOpen(entity: AdminEntity) {
  window.location.assign(`/dossier/content/edit?id=${entity.id}`);
}
