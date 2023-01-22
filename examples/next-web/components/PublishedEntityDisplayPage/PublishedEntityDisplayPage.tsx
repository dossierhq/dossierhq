import { PublishedEntityDisplayScreen } from '@dossierhq/react-components';
import Head from 'next/head';
import { AppPublishedDossierProvider } from '../../contexts/AppPublishedDossierProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { NavBar } from '../NavBar/NavBar';

export default function PublishedEntityDetailPage(): JSX.Element | null {
  const { onUrlSearchParamsChange, urlSearchParams } = useUrlSearchParams();

  return (
    <AppPublishedDossierProvider>
      <Head>
        <title>Published entities | {process.env.NEXT_PUBLIC_SITE_NAME}</title>
      </Head>
      <PublishedEntityDisplayScreen
        header={<NavBar current="published-entities" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
      />
    </AppPublishedDossierProvider>
  );
}
