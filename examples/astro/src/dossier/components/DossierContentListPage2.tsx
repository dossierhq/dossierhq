import {
  addContentEditorParamsToURLSearchParams,
  ContentListScreen,
  ThemeProvider,
} from '@dossierhq/react-components2';
import { useCallback } from 'react';
import { useUrlSearchParams } from '../hooks/useUrlSearchParams.js';
import { AppDossierProvider2 } from './AppDossierProvider2.js';

export function DossierContentListPage2() {
  const [urlSearchParams, setSearchParams] = useUrlSearchParams();

  const handleOpenEntity = useCallback(
    (id: string) => {
      const editorUrlsSearchParams = new URLSearchParams(urlSearchParams ?? undefined);
      addContentEditorParamsToURLSearchParams(editorUrlsSearchParams, { entities: [{ id }] });
      window.location.assign(`/dossier2/content/edit?${editorUrlsSearchParams.toString()}`);
    },
    [urlSearchParams],
  );

  const handleCreateEntity = useCallback(
    (type: string) => {
      const editorUrlsSearchParams = new URLSearchParams(urlSearchParams ?? undefined);
      addContentEditorParamsToURLSearchParams(editorUrlsSearchParams, {
        entities: [{ type, isNew: true, id: crypto.randomUUID() }],
      });
      window.location.assign(`/dossier2/content/edit?${editorUrlsSearchParams.toString()}`);
    },
    [urlSearchParams],
  );

  return (
    <ThemeProvider>
      <AppDossierProvider2>
        <ContentListScreen
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setSearchParams}
          onOpenEntity={handleOpenEntity}
          onCreateEntity={handleCreateEntity}
        />
      </AppDossierProvider2>
    </ThemeProvider>
  );
}
