import { PublishedContentDisplayScreen } from '@dossierhq/react-components';
import Head from 'next/head';
import { AppPublishedDossierProvider } from '../../contexts/AppPublishedDossierProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { NavBar } from '../NavBar/NavBar';

export default function PublishedEntityDetailPage(): JSX.Element | null {
  const { onUrlSearchParamsChange, urlSearchParams } = useUrlSearchParams();

  return (
    <AppPublishedDossierProvider>
      <Head>
        <title>Published content | Blog</title>
      </Head>
      <PublishedContentDisplayScreen
        header={<NavBar current="published-content" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
      />
    </AppPublishedDossierProvider>
  );
}
