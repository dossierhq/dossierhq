import { EntityEditorScreen } from '@dossierhq/react-components';
import Head from 'next/head';
import { useMemo, useState } from 'react';
import { AppAdminDossierProvider } from '../../contexts/AppAdminDossierProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { useWarningOnExit } from '../../hooks/useWarningOnExit';
import { BrowserUrls } from '../../utils/BrowserUrls';
import { NavBar } from '../NavBar/NavBar';

export default function AdminEntityEditorPage(): JSX.Element {
  const { onUrlSearchParamsChange, urlSearchParams } = useUrlSearchParams();
  const [hasChanges, setHasChanges] = useState(false);

  const shouldWarn = useMemo(() => {
    if (!hasChanges) return false;
    return (_fromUrl: string, toUrl: string) => {
      return !BrowserUrls.isEditPage(toUrl);
    };
  }, [hasChanges]);

  useWarningOnExit('Changes will be lost, are you sure you want to leave the page?', shouldWarn);

  return (
    <AppAdminDossierProvider>
      <Head>
        <title>Edit entities | {process.env.NEXT_PUBLIC_SITE_NAME}</title>
      </Head>
      <EntityEditorScreen
        header={<NavBar current="admin-entities" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
        onEditorHasChangesChange={setHasChanges}
      />
    </AppAdminDossierProvider>
  );
}
