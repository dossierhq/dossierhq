import { ContentEditorScreen } from '@dossierhq/react-components';
import Head from 'next/head';
import { useMemo, useState } from 'react';
import { AppAdminDossierProvider } from '../../contexts/AppAdminDossierProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { useWarningOnExit } from '../../hooks/useWarningOnExit';
import { BrowserUrls } from '../../utils/BrowserUrls';
import { NavBar } from '../NavBar/NavBar';

export default function ContentEditorPage(): JSX.Element {
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
        <title>Edit content | {process.env.NEXT_PUBLIC_SITE_NAME}</title>
      </Head>
      <ContentEditorScreen
        header={<NavBar current="content" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
        onEditorHasChangesChange={setHasChanges}
      />
    </AppAdminDossierProvider>
  );
}
