import { ContentEditorScreen, ThemeProvider } from '@dossierhq/react-components2';
import { useState } from 'react';
import { useUrlSearchParams } from '../hooks/useUrlSearchParams.js';
import { AppAdminDossierProvider } from './AppAdminDossierProvider.js';
import { NavBar } from './NavBar.js';

export function DossierContentEditorPage() {
  const [urlSearchParams, setSearchParams] = useUrlSearchParams();
  const [_hasChanges, setHasChanges] = useState(false);

  //TODO warn if hasChanges

  return (
    <ThemeProvider>
      <AppAdminDossierProvider>
        <ContentEditorScreen
          header={<NavBar current="content" />}
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setSearchParams}
          onEditorHasChangesChange={setHasChanges}
        />
      </AppAdminDossierProvider>
    </ThemeProvider>
  );
}
