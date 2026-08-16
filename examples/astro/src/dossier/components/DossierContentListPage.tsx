import {
  addContentEditorParamsToURLSearchParams,
  ContentListScreen,
  ThemeProvider,
} from '@dossierhq/react-components2';
import { useCallback } from 'react';
import { useUrlSearchParams } from '../hooks/useUrlSearchParams.js';
import { AppAdminDossierProvider } from './AppAdminDossierProvider.js';
import { NavBar } from './NavBar.js';

export function DossierContentListPage() {
  const [urlSearchParams, setSearchParams] = useUrlSearchParams();

  const handleOpenEntity = useCallback(
    (id: string) => {
      const editorUrlsSearchParams = new URLSearchParams(urlSearchParams ?? undefined);
      addContentEditorParamsToURLSearchParams(editorUrlsSearchParams, { entities: [{ id }] });
      window.location.assign(`/dossier/content/edit?${editorUrlsSearchParams.toString()}`);
    },
    [urlSearchParams],
  );

  const handleCreateEntity = useCallback(
    (type: string) => {
      const editorUrlsSearchParams = new URLSearchParams(urlSearchParams ?? undefined);
      addContentEditorParamsToURLSearchParams(editorUrlsSearchParams, {
        entities: [{ type, isNew: true, id: crypto.randomUUID() }],
      });
      window.location.assign(`/dossier/content/edit?${editorUrlsSearchParams.toString()}`);
    },
    [urlSearchParams],
  );

  return (
    <ThemeProvider>
      <AppAdminDossierProvider>
        <ContentListScreen
          header={<NavBar current="content" />}
          urlSearchParams={urlSearchParams}
          onUrlSearchParamsChange={setSearchParams}
          onOpenEntity={handleOpenEntity}
          onCreateEntity={handleCreateEntity}
        />
      </AppAdminDossierProvider>
    </ThemeProvider>
  );
}
