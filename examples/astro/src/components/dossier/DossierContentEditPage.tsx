import { NotificationContainer } from '@dossierhq/design';
import { EntityEditorScreen } from '@dossierhq/react-components';
import { useState } from 'react';
import { AppAdminDossierProvider } from './AppAdminDossierProvider.jsx';
import { NavBar } from './NavBar.js';
import { useUrlSearchParams } from './useUrlSearchParams.js';

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
