import { ChangelogListScreen } from '@dossierhq/react-components';
import Head from 'next/head';
import { AppAdminDossierProvider } from '../../contexts/AppAdminDossierProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { NavBar } from '../NavBar/NavBar';

export default function ChangelogListPage() {
  const { onUrlSearchParamsChange, urlSearchParams } = useUrlSearchParams();

  return (
    <AppAdminDossierProvider>
      <Head>
        <title>Changelog | Blog</title>
      </Head>
      <ChangelogListScreen
        header={<NavBar current="changelog" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
      />
    </AppAdminDossierProvider>
  );
}
