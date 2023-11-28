import { NotificationContainer } from '@dossierhq/design';
import { EntityEditorScreen } from '@dossierhq/react-components';
import { useState } from 'react';
import { useUrlSearchParams } from '../hooks/useUrlSearchParams.js';
import { AppAdminDossierProvider } from './AppAdminDossierProvider.js';
import { NavBar } from './NavBar.js';

export function DossierContentEditPage() {
  const [urlSearchParams, setSearchParams] = useUrlSearchParams();
  const [_hasChanges, setHasChanges] = useState(false);

  //TODO warn if hasChanges

  return (
    <AppAdminDossierProvider>
      <NotificationContainer>
        <EntityEditorScreen
          header={<NavBar current="content" />}
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setSearchParams}
          onEditorHasChangesChange={setHasChanges}
        />
      </NotificationContainer>
    </AppAdminDossierProvider>
  );
}
