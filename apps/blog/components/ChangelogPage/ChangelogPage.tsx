import { ChangelogScreen } from '@dossierhq/react-components';
import Head from 'next/head';
import { AppAdminDossierProvider } from '../../contexts/AppAdminDossierProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { NavBar } from '../NavBar/NavBar';

export default function ChangelogPage() {
  const { onUrlSearchParamsChange, urlSearchParams } = useUrlSearchParams();

  return (
    <AppAdminDossierProvider>
      <Head>
        <title>Changelog | Blog</title>
      </Head>
      <ChangelogScreen
        header={<NavBar current="changelog" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
      />
    </AppAdminDossierProvider>
  );
}
