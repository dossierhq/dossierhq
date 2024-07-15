import { ContentEditorScreen, ThemeProvider } from '@dossierhq/react-components2';
import { useState } from 'react';
import { useUrlSearchParams } from '../hooks/useUrlSearchParams.js';
import { AppDossierProvider2 } from './AppDossierProvider2.js';

export function DossierContentEditorPage2() {
  const [urlSearchParams, setSearchParams] = useUrlSearchParams();
  const [_hasChanges, setHasChanges] = useState(false);

  //TODO warn if hasChanges

  return (
    <ThemeProvider>
      <AppDossierProvider2>
        <ContentEditorScreen
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setSearchParams}
          onEditorHasChangesChange={setHasChanges}
        />
      </AppDossierProvider2>
    </ThemeProvider>
  );
}
